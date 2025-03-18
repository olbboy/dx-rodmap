"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Tag } from "@/types";

export interface TagFormData {
  name: string;
  color: string;
}

export async function getTagsByRoadmapId(roadmapId: string): Promise<{ data: Tag[] | null; error: Error | null }> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .order("name");
    
    if (error) {
      console.error("Error fetching tags:", error);
      return { data: null, error: new Error(error.message) };
    }
    
    return { data, error: null };
  } catch (error: any) {
    console.error("Error in getTagsByRoadmapId:", error);
    return { data: null, error };
  }
}

export async function createTag(
  roadmapId: string,
  data: TagFormData
): Promise<{ data: Tag | null; error: Error | null }> {
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

    // Create the tag
    const { data: tag, error: tagError } = await supabase
      .from("tags")
      .insert({
        roadmap_id: roadmapId,
        name: data.name,
        color: data.color,
      })
      .select()
      .single();

    if (tagError) {
      return { data: null, error: new Error(tagError.message) };
    }

    revalidatePath(`/roadmaps/${roadmapId}`);
    return { data: tag, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function updateTag(
  tagId: string,
  data: TagFormData
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: new Error("Not authenticated") };
    }

    // Get tag to check ownership
    const { data: tag, error: tagError } = await supabase
      .from("tags")
      .select("roadmap_id")
      .eq("id", tagId)
      .single();

    if (tagError || !tag) {
      return { success: false, error: new Error("Tag not found") };
    }

    // Check if user owns the roadmap
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .select("owner_id")
      .eq("id", tag.roadmap_id)
      .single();

    if (roadmapError || !roadmap) {
      return { success: false, error: new Error("Roadmap not found") };
    }

    if (roadmap.owner_id !== user.id) {
      return { success: false, error: new Error("Not authorized") };
    }

    // Update the tag
    const { error: updateError } = await supabase
      .from("tags")
      .update({
        name: data.name,
        color: data.color,
      })
      .eq("id", tagId);

    if (updateError) {
      return { success: false, error: new Error(updateError.message) };
    }

    revalidatePath(`/roadmaps/${tag.roadmap_id}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error };
  }
}

export async function deleteTag(
  tagId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: new Error("Not authenticated") };
    }

    // Get tag to check ownership
    const { data: tag, error: tagError } = await supabase
      .from("tags")
      .select("roadmap_id")
      .eq("id", tagId)
      .single();

    if (tagError || !tag) {
      return { success: false, error: new Error("Tag not found") };
    }

    // Check if user owns the roadmap
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .select("owner_id")
      .eq("id", tag.roadmap_id)
      .single();

    if (roadmapError || !roadmap) {
      return { success: false, error: new Error("Roadmap not found") };
    }

    if (roadmap.owner_id !== user.id) {
      return { success: false, error: new Error("Not authorized") };
    }

    // Delete tag connections first
    const { error: deleteConnectionsError } = await supabase
      .from("feature_tags")
      .delete()
      .eq("tag_id", tagId);

    if (deleteConnectionsError) {
      return { success: false, error: new Error(deleteConnectionsError.message) };
    }

    // Delete tag
    const { error: deleteError } = await supabase
      .from("tags")
      .delete()
      .eq("id", tagId);

    if (deleteError) {
      return { success: false, error: new Error(deleteError.message) };
    }

    revalidatePath(`/roadmaps/${tag.roadmap_id}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error };
  }
} 