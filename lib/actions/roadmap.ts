"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface RoadmapData {
  title: string;
  description: string;
  is_public: boolean;
}

export async function createRoadmap(data: RoadmapData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: "Not authenticated" } };
  }
  
  const { data: roadmap, error } = await supabase
    .from("roadmaps")
    .insert({
      title: data.title,
      description: data.description,
      is_public: data.is_public,
      owner_id: user.id,
    })
    .select()
    .single();
  
  if (error) {
    return { data: null, error };
  }
  
  revalidatePath("/dashboard");
  return { data: roadmap, error: null };
}

export async function updateRoadmap(id: string, data: RoadmapData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: "Not authenticated" } };
  }
  
  // Check if user owns the roadmap
  const { data: roadmap, error: fetchError } = await supabase
    .from("roadmaps")
    .select()
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();
  
  if (fetchError) {
    return { data: null, error: { message: "Roadmap not found or you don't have permission" } };
  }
  
  const { data: updatedRoadmap, error } = await supabase
    .from("roadmaps")
    .update({
      title: data.title,
      description: data.description,
      is_public: data.is_public,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    return { data: null, error };
  }
  
  revalidatePath("/dashboard");
  revalidatePath(`/roadmaps/${id}`);
  return { data: updatedRoadmap, error: null };
}

export async function deleteRoadmap(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: { message: "Not authenticated" } };
  }
  
  // Check if user owns the roadmap
  const { data: roadmap, error: fetchError } = await supabase
    .from("roadmaps")
    .select()
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();
  
  if (fetchError) {
    return { success: false, error: { message: "Roadmap not found or you don't have permission" } };
  }
  
  const { error } = await supabase
    .from("roadmaps")
    .delete()
    .eq("id", id);
  
  if (error) {
    return { success: false, error };
  }
  
  revalidatePath("/dashboard");
  return { success: true, error: null };
} 