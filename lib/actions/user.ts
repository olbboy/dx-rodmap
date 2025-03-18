"use server";

import { createClient } from "@/lib/supabase/server";
import { User } from "@/types";

export async function getAllUsers(): Promise<User[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("users")
      .select("id, email, display_name, avatar_url")
      .order("display_name", { ascending: true });
    
    if (error) {
      console.error("Error fetching users:", error);
      return [];
    }
    
    return data as User[];
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return [];
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("users")
      .select("id, email, display_name, avatar_url")
      .eq("id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }
    
    return data as User;
  } catch (error) {
    console.error("Error in getUserById:", error);
    return null;
  }
} 