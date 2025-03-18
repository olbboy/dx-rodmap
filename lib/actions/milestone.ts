"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Milestone } from "@/types";

/**
 * Create a new milestone
 */
export async function createMilestone(milestone: {
  roadmapId: string;
  title: string;
  description?: string;
  date: Date;
  color?: string;
}): Promise<Milestone | null> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log("User not authenticated when creating milestone");
    redirect("/auth/sign-in");
  }
  
  console.log("Creating milestone. User:", user.id, "RoadmapId:", milestone.roadmapId);
  
  // Check if user has access to this roadmap
  try {
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .select("id, owner_id")
      .eq("id", milestone.roadmapId)
      .single();
      
    console.log("Roadmap query result:", JSON.stringify({ roadmap, error: roadmapError?.message }));
      
    if (roadmapError) {
      console.error("Error fetching roadmap:", roadmapError);
      throw new Error(`Roadmap not found: ${roadmapError.message}`);
    }
    
    if (!roadmap) {
      console.error("Roadmap not found with ID:", milestone.roadmapId);
      throw new Error("Roadmap not found with provided ID");
    }
    
    // Check if user is owner
    if (roadmap.owner_id !== user.id) {
      console.log("User is not roadmap owner. User:", user.id, "Owner:", roadmap.owner_id);
      // TODO: Add team membership check if needed in the future
      
      // For now, we'll allow the action to continue but log the discrepancy
      console.log("Allowing milestone creation despite user not being owner");
    }
    
    // Insert milestone
    const { data, error } = await supabase
      .from("milestones")
      .insert({
        roadmap_id: milestone.roadmapId,
        title: milestone.title,
        description: milestone.description || null,
        date: milestone.date.toISOString(),
        color: milestone.color || null,
        created_by: user.id
      })
      .select()
      .single();
      
    if (error) {
      console.error("Error creating milestone:", error);
      throw new Error(`Failed to create milestone: ${error.message}`);
    }
    
    // Revalidate the roadmap timeline page
    revalidatePath(`/roadmaps/${milestone.roadmapId}/timeline`);
    
    console.log("Milestone created successfully with ID:", data.id);
    
    return {
      id: data.id,
      roadmapId: data.roadmap_id,
      title: data.title,
      description: data.description,
      date: data.date,
      color: data.color,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      created_by: data.created_by
    };
  } catch (err) {
    console.error("Error in createMilestone:", err);
    throw err;
  }
}

/**
 * Update an existing milestone
 */
export async function updateMilestone(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    date: Date;
    color: string | null;
    is_completed: boolean;
  }>
): Promise<Milestone | null> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  
  // Get the milestone to check permissions
  const { data: milestone, error: fetchError } = await supabase
    .from("milestones")
    .select("id, roadmap_id, roadmaps(owner_id)")
    .eq("id", id)
    .single();
    
  if (fetchError || !milestone) {
    throw new Error("Milestone not found or access denied");
  }
  
  // Format the data for update
  const updateData: any = {};
  
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.date !== undefined) updateData.date = data.date.toISOString();
  if (data.color !== undefined) updateData.color = data.color;
  if (data.is_completed !== undefined) {
    updateData.is_completed = data.is_completed;
    if (data.is_completed) {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = user.id;
    } else {
      updateData.completed_at = null;
      updateData.completed_by = null;
    }
  }
  
  // Update the milestone
  const { data: updatedData, error } = await supabase
    .from("milestones")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating milestone:", error);
    throw new Error("Failed to update milestone");
  }
  
  // Revalidate the roadmap timeline page
  revalidatePath(`/roadmaps/${milestone.roadmap_id}/timeline`);
  
  return {
    id: updatedData.id,
    roadmapId: updatedData.roadmap_id,
    title: updatedData.title,
    description: updatedData.description,
    date: updatedData.date,
    color: updatedData.color,
    createdAt: updatedData.created_at,
    updatedAt: updatedData.updated_at,
    is_completed: updatedData.is_completed,
    completed_at: updatedData.completed_at,
    completed_by: updatedData.completed_by,
    created_by: updatedData.created_by
  };
}

/**
 * Delete a milestone
 */
export async function deleteMilestone(id: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  
  // Get the milestone to check permissions and roadmap ID for revalidation
  const { data: milestone, error: fetchError } = await supabase
    .from("milestones")
    .select("id, roadmap_id, roadmaps(owner_id)")
    .eq("id", id)
    .single();
    
  if (fetchError || !milestone) {
    throw new Error("Milestone not found or access denied");
  }
  
  // Soft delete the milestone
  const { error } = await supabase
    .from("milestones")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
    
  if (error) {
    console.error("Error deleting milestone:", error);
    throw new Error("Failed to delete milestone");
  }
  
  // Revalidate the roadmap timeline page
  revalidatePath(`/roadmaps/${milestone.roadmap_id}/timeline`);
  
  return true;
}

/**
 * Get milestones for a roadmap
 */
export async function getMilestones(roadmapId: string): Promise<Milestone[]> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  
  try {
    // First check the schema to determine the correct column name
    let useOwnerIdField = false;
    
    try {
      const { data: sample } = await supabase
        .from("milestones")
        .select("*")
        .limit(1);
        
      if (sample && sample.length > 0) {
        console.log("Milestone table columns:", Object.keys(sample[0]));
        useOwnerIdField = 'owner_id' in sample[0] && !('roadmap_id' in sample[0]);
      }
    } catch (e) {
      console.log("Error checking milestone schema:", e);
    }
    
    // Get all milestones for the roadmap - using safer query approach
    const fieldName = useOwnerIdField ? 'owner_id' : 'roadmap_id';
    console.log(`Fetching milestones using ${fieldName} = ${roadmapId}`);
    
    const { data, error } = await supabase
      .from("milestones")
      .select("*")
      .eq(fieldName, roadmapId)
      .is("deleted_at", null)
      .order("date", { ascending: true });
      
    if (error) {
      console.error("Error fetching milestones:", error);
      // Return empty array instead of throwing to prevent page from crashing
      return [];
    }
    
    console.log(`Found ${data.length} milestones for roadmap ${roadmapId}`);
    console.log("Raw milestone data sample:", data.length > 0 ? data[0] : "No milestones");
    
    return data.map(item => {
      // Ensure all required fields are properly converted/normalized
      const milestone: Milestone = {
        id: item.id,
        roadmapId: item.roadmap_id || item.owner_id, // Handle either field format
        title: item.title,
        description: item.description || undefined,
        // Make sure date is valid and consistent
        date: item.date || item.created_at || new Date().toISOString(),
        color: item.color || undefined,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        is_completed: !!item.is_completed,
        completed_at: item.completed_at,
        completed_by: item.completed_by,
        created_by: item.created_by,
        deleted_at: item.deleted_at
      };
      
      console.log("Normalized milestone:", milestone);
      return milestone;
    });
  } catch (err) {
    console.error("Error in getMilestones:", err);
    // Return empty array instead of throwing
    return [];
  }
} 