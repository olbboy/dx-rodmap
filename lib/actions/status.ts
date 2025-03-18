"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Status } from "@/types";

export interface StatusFormData {
  name: string;
  color: string;
}

export async function getStatusesByRoadmapId(roadmapId: string): Promise<Status[]> {
  try {
    console.log(`Getting statuses for roadmap ID: ${roadmapId}`);
    const supabase = await createClient();
    
    // Fetch statuses
    const { data: statuses, error } = await supabase
      .from("statuses")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .order("order_index");
    
    if (error) {
      console.error("Error fetching statuses:", error);
      return [];
    }
    
    console.log(`Found ${statuses?.length || 0} statuses:`, statuses);
    return statuses || [];
  } catch (error) {
    console.error("Error in getStatusesByRoadmapId:", error);
    return [];
  }
}

export async function createStatus(
  roadmapId: string,
  data: StatusFormData
): Promise<{ data: Status | null; error: Error | null }> {
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

    // Get max order for placing the new status
    const { data: maxOrderStatus } = await supabase
      .from("statuses")
      .select("order_index")
      .eq("roadmap_id", roadmapId)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = maxOrderStatus ? maxOrderStatus.order_index + 1 : 0;

    // Create the status
    const { data: status, error: statusError } = await supabase
      .from("statuses")
      .insert({
        roadmap_id: roadmapId,
        name: data.name,
        color: data.color,
        order_index: nextOrder,
        created_by: user.id,
      })
      .select()
      .single();

    if (statusError) {
      return { data: null, error: new Error(statusError.message) };
    }

    revalidatePath(`/roadmaps/${roadmapId}`);
    return { data: status, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function updateStatus(
  statusId: string,
  data: StatusFormData
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: new Error("Not authenticated") };
    }

    // Get status to check ownership
    const { data: status, error: statusError } = await supabase
      .from("statuses")
      .select("roadmap_id")
      .eq("id", statusId)
      .single();

    if (statusError || !status) {
      return { success: false, error: new Error("Status not found") };
    }

    // Check if user owns the roadmap
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .select("owner_id")
      .eq("id", status.roadmap_id)
      .single();

    if (roadmapError || !roadmap) {
      return { success: false, error: new Error("Roadmap not found") };
    }

    if (roadmap.owner_id !== user.id) {
      return { success: false, error: new Error("Not authorized") };
    }

    // Update the status
    const { error: updateError } = await supabase
      .from("statuses")
      .update({
        name: data.name,
        color: data.color,
      })
      .eq("id", statusId);

    if (updateError) {
      return { success: false, error: new Error(updateError.message) };
    }

    revalidatePath(`/roadmaps/${status.roadmap_id}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error };
  }
}

export async function deleteStatus(
  statusId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: new Error("Not authenticated") };
    }

    // Get status to check ownership
    const { data: status, error: statusError } = await supabase
      .from("statuses")
      .select("roadmap_id")
      .eq("id", statusId)
      .single();

    if (statusError || !status) {
      return { success: false, error: new Error("Status not found") };
    }

    // Check if user owns the roadmap
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .select("owner_id")
      .eq("id", status.roadmap_id)
      .single();

    if (roadmapError || !roadmap) {
      return { success: false, error: new Error("Roadmap not found") };
    }

    if (roadmap.owner_id !== user.id) {
      return { success: false, error: new Error("Not authorized") };
    }

    // Check if status has features
    const { count, error: countError } = await supabase
      .from("features")
      .select("*", { count: "exact", head: true })
      .eq("status_id", statusId);

    if (countError) {
      return { success: false, error: new Error(countError.message) };
    }

    if (count && count > 0) {
      return { success: false, error: new Error("Cannot delete status with features") };
    }

    // Delete status
    const { error: deleteError } = await supabase
      .from("statuses")
      .delete()
      .eq("id", statusId);

    if (deleteError) {
      return { success: false, error: new Error(deleteError.message) };
    }

    revalidatePath(`/roadmaps/${status.roadmap_id}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error };
  }
}

export async function reorderStatuses(
  roadmapId: string,
  statusOrder: { id: string; order_index: number }[]
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: new Error("Not authenticated") };
    }

    // Check if user owns the roadmap
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .select("owner_id")
      .eq("id", roadmapId)
      .single();

    if (roadmapError || !roadmap) {
      return { success: false, error: new Error("Roadmap not found") };
    }

    if (roadmap.owner_id !== user.id) {
      return { success: false, error: new Error("Not authorized") };
    }

    // Update each status with its new order
    for (const status of statusOrder) {
      const { error } = await supabase
        .from("statuses")
        .update({ order_index: status.order_index })
        .eq("id", status.id)
        .eq("roadmap_id", roadmapId);

      if (error) {
        return { success: false, error: new Error(error.message) };
      }
    }

    revalidatePath(`/roadmaps/${roadmapId}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error };
  }
}

export async function getAllStatuses(roadmapId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("statuses")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .order("order_index", { ascending: true });
    
    if (error) {
      console.error("Error fetching statuses:", error);
      return [];
    }
    
    return data as Status[];
  } catch (error) {
    console.error("Error in getAllStatuses:", error);
    return [];
  }
}

// Alias for getAllStatuses for backward compatibility
export async function getStatuses(roadmapId: string) {
  return getAllStatuses(roadmapId);
}

export async function getStatusById(statusId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("statuses")
      .select("*")
      .eq("id", statusId)
      .single();
    
    if (error) {
      console.error("Error fetching status:", error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Error in getStatusById:", error);
    return { data: null, error };
  }
} 