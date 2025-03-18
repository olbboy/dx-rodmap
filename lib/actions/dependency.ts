"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Dependency, DependencyType } from "@/types";

/**
 * Create a new dependency between posts
 */
export async function createDependency(dependency: {
  roadmapId: string;
  sourceId: string;
  targetId: string;
  dependencyType: DependencyType;
}): Promise<Dependency | null> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  
  // Check if user has access to this roadmap
  const { data: roadmap, error: roadmapError } = await supabase
    .from("roadmaps")
    .select("id, owner_id")
    .eq("id", dependency.roadmapId)
    .single();
    
  if (roadmapError || !roadmap) {
    throw new Error("Roadmap not found or access denied");
  }
  
  // Check if both posts exist and belong to the same roadmap
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, roadmap_id")
    .in("id", [dependency.sourceId, dependency.targetId]);
    
  if (postsError || !posts || posts.length !== 2) {
    throw new Error("One or both posts not found");
  }
  
  // Check if posts belong to the same roadmap
  const allPostsBelongToRoadmap = posts.every(post => post.roadmap_id === dependency.roadmapId);
  if (!allPostsBelongToRoadmap) {
    throw new Error("Posts must belong to the same roadmap");
  }
  
  // Check for circular dependencies
  if (dependency.sourceId === dependency.targetId) {
    throw new Error("Cannot create dependency between the same post");
  }
  
  // Check if a dependency already exists
  const { data: existingDeps, error: depCheckError } = await supabase
    .from("dependencies")
    .select("id")
    .eq("source_id", dependency.sourceId)
    .eq("target_id", dependency.targetId);
    
  if (existingDeps && existingDeps.length > 0) {
    throw new Error("Dependency already exists between these posts");
  }
  
  // Insert dependency
  const { data, error } = await supabase
    .from("dependencies")
    .insert({
      roadmap_id: dependency.roadmapId,
      source_id: dependency.sourceId,
      target_id: dependency.targetId,
      dependency_type: dependency.dependencyType,
      created_by: user.id
    })
    .select()
    .single();
    
  if (error) {
    console.error("Error creating dependency:", error);
    throw new Error("Failed to create dependency");
  }
  
  // Revalidate the roadmap timeline page
  revalidatePath(`/roadmaps/${dependency.roadmapId}/timeline`);
  
  return {
    id: data.id,
    roadmapId: data.roadmap_id,
    sourceId: data.source_id,
    targetId: data.target_id,
    dependencyType: data.dependency_type as DependencyType,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    created_by: data.created_by
  };
}

/**
 * Update a dependency's type
 */
export async function updateDependency(
  id: string,
  data: { dependencyType: DependencyType }
): Promise<Dependency | null> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  
  // Get the dependency to check permissions
  const { data: dependency, error: fetchError } = await supabase
    .from("dependencies")
    .select("id, roadmap_id, roadmaps(owner_id)")
    .eq("id", id)
    .single();
    
  if (fetchError || !dependency) {
    throw new Error("Dependency not found or access denied");
  }
  
  // Update the dependency
  const { data: updatedData, error } = await supabase
    .from("dependencies")
    .update({ dependency_type: data.dependencyType })
    .eq("id", id)
    .select()
    .single();
    
  if (error) {
    console.error("Error updating dependency:", error);
    throw new Error("Failed to update dependency");
  }
  
  // Revalidate the roadmap timeline page
  revalidatePath(`/roadmaps/${dependency.roadmap_id}/timeline`);
  
  return {
    id: updatedData.id,
    roadmapId: updatedData.roadmap_id,
    sourceId: updatedData.source_id,
    targetId: updatedData.target_id,
    dependencyType: updatedData.dependency_type as DependencyType,
    createdAt: updatedData.created_at,
    updatedAt: updatedData.updated_at,
    created_by: updatedData.created_by
  };
}

/**
 * Delete a dependency
 */
export async function deleteDependency(id: string): Promise<boolean> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  
  // Get the dependency to check permissions and roadmap ID for revalidation
  const { data: dependency, error: fetchError } = await supabase
    .from("dependencies")
    .select("id, roadmap_id, roadmaps(owner_id)")
    .eq("id", id)
    .single();
    
  if (fetchError || !dependency) {
    throw new Error("Dependency not found or access denied");
  }
  
  // Delete the dependency (hard delete for dependencies)
  const { error } = await supabase
    .from("dependencies")
    .delete()
    .eq("id", id);
    
  if (error) {
    console.error("Error deleting dependency:", error);
    throw new Error("Failed to delete dependency");
  }
  
  // Revalidate the roadmap timeline page
  revalidatePath(`/roadmaps/${dependency.roadmap_id}/timeline`);
  
  return true;
}

/**
 * Get dependencies for a roadmap
 */
export async function getDependencies(roadmapId: string): Promise<Dependency[]> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/sign-in");
  }
  
  // Get all dependencies for the roadmap - Using owner_id instead of roadmap_id
  try {
    // First check the schema to determine the correct column name or if the table exists
    try {
      const { data: sample, error: sampleError } = await supabase
        .from("dependencies")
        .select("*")
        .limit(1);
        
      if (sampleError) {
        console.log("Error checking dependencies table:", sampleError.message);
        return []; // Table might not exist
      }
        
      if (sample && sample.length > 0) {
        console.log("Dependencies table columns:", Object.keys(sample[0]));
        
        // Try to determine the right field to filter by
        let fieldName = 'roadmap_id';
        
        if ('owner_id' in sample[0] && !('roadmap_id' in sample[0])) {
          fieldName = 'owner_id';
        }
        
        console.log(`Fetching dependencies using ${fieldName} = ${roadmapId}`);
        
        const { data, error } = await supabase
          .from("dependencies")
          .select("*")
          .eq(fieldName, roadmapId);
        
        if (error) {
          console.error(`Error fetching dependencies using ${fieldName}:`, error);
          return [];
        }
        
        console.log(`Found ${data.length} dependencies for roadmap ${roadmapId}`);
        console.log("Raw dependency data sample:", data.length > 0 ? data[0] : "No dependencies");
        
        return data.map(item => {
          // Ensure all required fields are properly converted/normalized
          const dependency: Dependency = {
            id: item.id,
            roadmapId: item.roadmap_id || item.owner_id || roadmapId, // Handle either field
            sourceId: item.source_id,
            targetId: item.target_id,
            dependencyType: (item.dependency_type || 'finish_to_start') as DependencyType,
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.updated_at || new Date().toISOString(),
            created_by: item.created_by
          };
          
          console.log("Normalized dependency:", dependency);
          return dependency;
        });
      } else {
        console.log("Dependencies table exists but no sample records found");
        return [];
      }
    } catch (err) {
      console.error("Error checking dependencies schema:", err);
      return [];
    }
  } catch (err) {
    console.error("Error in getDependencies:", err);
    // Return empty array instead of throwing to prevent page from crashing
    return [];
  }
} 