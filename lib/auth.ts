import { createClient } from "@/lib/supabase/server";

export async function auth() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email
    };
  } catch (error) {
    console.error("Error in auth function:", error);
    return null;
  }
} 