"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Feature } from "@/types";

export interface FeatureFormData {
  title: string;
  description?: string;
  status_id?: string;
  assignee_id?: string;
  start_date?: string;
  due_date?: string;
  tags?: string[];
}

export async function getFeaturesByRoadmapId(roadmapId: string): Promise<Feature[]> {
  try {
    console.log(`Getting features for roadmap ID: ${roadmapId}`);
    const supabase = await createClient();
    
    // Check if features table exists
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'features');
    
    if (tablesError) {
      console.error("Error checking tables:", tablesError);
    } else {
      console.log("Tables check:", tablesData);
    }
    
    // Fetch features first
    const { data: features, error } = await supabase
      .from("features")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .order("order");
    
    if (error) {
      console.error("Error fetching features:", error);
      return [];
    }
    
    // Early return if no features
    if (!features || features.length === 0) {
      console.log("No features found for this roadmap");
      return [];
    }
    
    // Get feature IDs for related data queries
    const featureIds = features.map(feature => feature.id);
    
    // Fetch statuses separately
    const { data: statuses = [] } = await supabase
      .from("statuses")
      .select("*")
      .eq("roadmap_id", roadmapId);
    
    console.log("Fetched statuses:", statuses);
    
    // Map statuses by ID for quick lookup
    const statusMap: Record<string, any> = {};
    if (statuses) {
      statuses.forEach(status => {
        statusMap[status.id] = status;
      });
    }
    
    // Fetch assignees (users/profiles)
    const userIds = features
      .map(feature => feature.assignee_id)
      .filter((id): id is string => id !== null);
    
    const assigneeMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: users = [] } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);
        
      if (users && users.length > 0) {
        users.forEach(user => {
          assigneeMap[user.id] = user;
        });
      }
    }
    
    // Fetch tags for features
    const tagsByFeature: Record<string, any[]> = {};
    if (featureIds.length > 0) {
      // First, get feature-tag relationships
      const { data: featureTags = [] } = await supabase
        .from("feature_tags")
        .select("feature_id, tag_id")
        .in("feature_id", featureIds);
      
      if (featureTags && featureTags.length > 0) {
        // Get all the tag IDs
        const tagIds = [...new Set(featureTags.map(ft => ft.tag_id))];
        
        // Fetch the actual tags
        const { data: tags = [] } = await supabase
          .from("tags")
          .select("*")
          .in("id", tagIds);
        
        // Create a map of tags by ID
        const tagMap: Record<string, any> = {};
        if (tags) {
          tags.forEach(tag => {
            tagMap[tag.id] = tag;
          });
        }
        
        // Group tags by feature
        featureTags.forEach(ft => {
          if (!tagsByFeature[ft.feature_id]) {
            tagsByFeature[ft.feature_id] = [];
          }
          if (tagMap[ft.tag_id]) {
            tagsByFeature[ft.feature_id].push(tagMap[ft.tag_id]);
          }
        });
      }
    }
    
    // Combine all the data
    const enhancedFeatures = features.map(feature => ({
      ...feature,
      status: feature.status_id && statusMap[feature.status_id] ? statusMap[feature.status_id] : null,
      assignee: feature.assignee_id && assigneeMap[feature.assignee_id] ? assigneeMap[feature.assignee_id] : null,
      tags: tagsByFeature[feature.id] || []
    }));
    
    console.log(`Found ${enhancedFeatures.length} features`);
    return enhancedFeatures;
  } catch (error) {
    console.error("Error in getFeaturesByRoadmapId:", error);
    return [];
  }
}

export async function createFeature(
  roadmapId: string,
  data: FeatureFormData
): Promise<{ data: Feature | null; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error("Not authenticated") };
    }

    // Check if user owns the roadmap
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .select("owner_id")
      .eq("id", roadmapId)
      .single();

    if (roadmapError || !roadmap) {
      return { data: null, error: new Error("Roadmap not found") };
    }

    if (roadmap.owner_id !== user.id) {
      return { data: null, error: new Error("Not authorized") };
    }

    // Get max order for this status to place the new feature at the end
    const { data: maxOrderFeature } = await supabase
      .from("features")
      .select("order")
      .eq("roadmap_id", roadmapId)
      .eq("status_id", data.status_id)
      .order("order", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = maxOrderFeature ? maxOrderFeature.order + 1 : 0;

    // Create the feature
    const { data: feature, error: featureError } = await supabase
      .from("features")
      .insert({
        roadmap_id: roadmapId,
        title: data.title,
        description: data.description || null,
        status_id: data.status_id || null,
        assignee_id: data.assignee_id || null,
        start_date: data.start_date || null,
        due_date: data.due_date || null,
        order: nextOrder,
      })
      .select()
      .single();

    if (featureError) {
      return { data: null, error: new Error(featureError.message) };
    }

    // Add tags if specified
    if (data.tags && data.tags.length > 0) {
      const featureTags = data.tags.map(tagId => ({
        feature_id: feature.id,
        tag_id: tagId,
      }));

      const { error: tagsError } = await supabase
        .from("feature_tags")
        .insert(featureTags);

      if (tagsError) {
        console.error("Failed to add tags:", tagsError);
      }
    }

    revalidatePath(`/roadmaps/${roadmapId}`);
    return { data: feature, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function updateFeature(
  featureId: string,
  data: FeatureFormData
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: new Error("Not authenticated") };
    }

    // Get feature to check ownership
    const { data: feature, error: featureError } = await supabase
      .from("features")
      .select("roadmap_id")
      .eq("id", featureId)
      .single();

    if (featureError || !feature) {
      return { success: false, error: new Error("Feature not found") };
    }

    // Check if user owns the roadmap
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .select("owner_id")
      .eq("id", feature.roadmap_id)
      .single();

    if (roadmapError || !roadmap) {
      return { success: false, error: new Error("Roadmap not found") };
    }

    if (roadmap.owner_id !== user.id) {
      return { success: false, error: new Error("Not authorized") };
    }

    // Update the feature
    const { error: updateError } = await supabase
      .from("features")
      .update({
        title: data.title,
        description: data.description || null,
        status_id: data.status_id || null,
        assignee_id: data.assignee_id || null,
        start_date: data.start_date || null,
        due_date: data.due_date || null,
      })
      .eq("id", featureId);

    if (updateError) {
      return { success: false, error: new Error(updateError.message) };
    }

    // If tags are specified, update them
    if (data.tags) {
      // Delete existing tags
      await supabase
        .from("feature_tags")
        .delete()
        .eq("feature_id", featureId);

      // Add new tags
      if (data.tags.length > 0) {
        const featureTags = data.tags.map(tagId => ({
          feature_id: featureId,
          tag_id: tagId,
        }));

        await supabase
          .from("feature_tags")
          .insert(featureTags);
      }
    }

    revalidatePath(`/roadmaps/${feature.roadmap_id}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error };
  }
}

export async function deleteFeature(
  featureId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: new Error("Not authenticated") };
    }

    // Get feature to check ownership
    const { data: feature, error: featureError } = await supabase
      .from("features")
      .select("roadmap_id")
      .eq("id", featureId)
      .single();

    if (featureError || !feature) {
      return { success: false, error: new Error("Feature not found") };
    }

    // Check if user owns the roadmap
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .select("owner_id")
      .eq("id", feature.roadmap_id)
      .single();

    if (roadmapError || !roadmap) {
      return { success: false, error: new Error("Roadmap not found") };
    }

    if (roadmap.owner_id !== user.id) {
      return { success: false, error: new Error("Not authorized") };
    }

    // Delete feature
    const { error: deleteError } = await supabase
      .from("features")
      .delete()
      .eq("id", featureId);

    if (deleteError) {
      return { success: false, error: new Error(deleteError.message) };
    }

    revalidatePath(`/roadmaps/${feature.roadmap_id}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error };
  }
}

export async function updateFeatureStatus(
  featureId: string,
  statusId: string,
  order: number
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: new Error("Not authenticated") };
    }

    // Get feature to check ownership
    const { data: feature, error: featureError } = await supabase
      .from("features")
      .select("roadmap_id")
      .eq("id", featureId)
      .single();

    if (featureError || !feature) {
      return { success: false, error: new Error("Feature not found") };
    }

    // Check if user owns the roadmap
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .select("owner_id")
      .eq("id", feature.roadmap_id)
      .single();

    if (roadmapError || !roadmap) {
      return { success: false, error: new Error("Roadmap not found") };
    }

    if (roadmap.owner_id !== user.id) {
      return { success: false, error: new Error("Not authorized") };
    }

    // Update the feature status
    const { error: updateError } = await supabase
      .from("features")
      .update({
        status_id: statusId,
        order,
      })
      .eq("id", featureId);

    if (updateError) {
      return { success: false, error: new Error(updateError.message) };
    }

    revalidatePath(`/roadmaps/${feature.roadmap_id}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error };
  }
} 