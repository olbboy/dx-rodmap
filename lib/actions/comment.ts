"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Comment } from "@/types";

export interface CommentFormData {
  content: string;
  parent_id?: string;
  mentioned_users?: string[];
}

/**
 * Get all comments for a post
 */
export async function getCommentsByPostId(postId: string): Promise<{ data: Comment[] | null; error: Error | null }> {
  try {
    const supabase = await createClient();
    
    // Fetch all comments for the post
    const { data: comments, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    
    if (error) {
      console.error("Error fetching comments:", error);
      return { data: null, error: new Error(error.message) };
    }
    
    if (!comments || comments.length === 0) {
      return { data: [], error: null };
    }
    
    // Collect all user IDs
    const userIds = [...new Set(comments.map(comment => comment.user_id))];
    
    // Fetch users in a separate query
    const { data: users, error: usersError } = await supabase
      .from("users")  // Assuming there's a users table in the public schema
      .select("id, email, display_name, avatar_url")
      .in("id", userIds);
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      // If we can't get user data from the users table, try to get it from auth.users
      // but note that we might not have direct access to auth.users from client-side
    }
    
    // Create users map for quick lookup
    const usersMap: Record<string, any> = {};
    if (users) {
      users.forEach(user => {
        usersMap[user.id] = user;
      });
    }
    
    // Collect parent comment IDs
    const parentIds = comments.filter(c => c.parent_id).map(c => c.parent_id);
    
    // Create a map of parent comments
    const parentsMap: Record<string, any> = {};
    if (parentIds.length > 0) {
      comments.forEach(comment => {
        if (parentIds.includes(comment.id)) {
          parentsMap[comment.id] = {
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            user_id: comment.user_id
          };
        }
      });
    }
    
    // Enrich comments with user and parent data
    const enrichedComments = comments.map(comment => ({
      ...comment,
      user: usersMap[comment.user_id] || { 
        id: comment.user_id,
        email: "user@example.com", // Fallback value
        display_name: "User" 
      },
      parent: comment.parent_id ? parentsMap[comment.parent_id] || null : null
    }));
    
    return { data: enrichedComments as Comment[], error: null };
  } catch (error: any) {
    console.error("Error in getCommentsByPostId:", error);
    return { data: null, error };
  }
}

/**
 * Create a new comment
 */
export async function createComment(
  postId: string,
  data: CommentFormData
): Promise<{ data: Comment | null; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: new Error("You must be logged in to comment") };
    }

    // Verify that the post exists and the user has access to it
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("id, roadmap_id")
      .eq("id", postId)
      .is("deleted_at", null)
      .single();

    if (postError || !post) {
      return { data: null, error: new Error("Post not found") };
    }

    // Create the comment
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        content: data.content,
        parent_id: data.parent_id || null,
        mentioned_users: data.mentioned_users || []
      })
      .select("*")
      .single();

    if (commentError) {
      return { data: null, error: new Error(commentError.message) };
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from("users")  // Try from public.users
      .select("id, email, display_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
    }

    // Add user data to comment
    const enrichedComment = {
      ...comment,
      user: userData || {
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        avatar_url: user.user_metadata?.avatar_url || null
      }
    };

    revalidatePath(`/roadmaps/${post.roadmap_id}/posts/${postId}`);
    return { data: enrichedComment as Comment, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

/**
 * Update an existing comment
 */
export async function updateComment(
  commentId: string,
  data: CommentFormData
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: new Error("You must be logged in to update a comment") };
    }

    // Get comment to check ownership
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("post_id, user_id")
      .eq("id", commentId)
      .single();

    if (commentError || !comment) {
      return { success: false, error: new Error("Comment not found") };
    }

    // Only the comment author can update it
    if (comment.user_id !== user.id) {
      return { success: false, error: new Error("You can only edit your own comments") };
    }

    // Get post and roadmap info for revalidation
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("roadmap_id")
      .eq("id", comment.post_id)
      .single();

    if (postError || !post) {
      return { success: false, error: new Error("Post not found") };
    }

    // Update the comment
    const { error: updateError } = await supabase
      .from("comments")
      .update({
        content: data.content,
        mentioned_users: data.mentioned_users || [],
        updated_at: new Date().toISOString(),
        is_edited: true
      })
      .eq("id", commentId);

    if (updateError) {
      return { success: false, error: new Error(updateError.message) };
    }

    revalidatePath(`/roadmaps/${post.roadmap_id}/posts/${comment.post_id}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error };
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(
  commentId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: new Error("You must be logged in to delete a comment") };
    }

    // Get comment to check ownership and get post info
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select("post_id, user_id")
      .eq("id", commentId)
      .single();

    if (commentError || !comment) {
      return { success: false, error: new Error("Comment not found") };
    }

    // Only the comment author can delete it
    if (comment.user_id !== user.id) {
      // Check if the user is the roadmap owner (they can delete any comment)
      const { data: post, error: postError } = await supabase
        .from("posts")
        .select("roadmap_id")
        .eq("id", comment.post_id)
        .single();

      if (postError || !post) {
        return { success: false, error: new Error("Post not found") };
      }

      const { data: roadmap, error: roadmapError } = await supabase
        .from("roadmaps")
        .select("owner_id")
        .eq("id", post.roadmap_id)
        .single();

      if (roadmapError || !roadmap || roadmap.owner_id !== user.id) {
        return { success: false, error: new Error("You can only delete your own comments") };
      }
    }

    // Get post info for revalidation
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("roadmap_id")
      .eq("id", comment.post_id)
      .single();

    if (postError || !post) {
      return { success: false, error: new Error("Post not found") };
    }

    // Delete the comment
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      return { success: false, error: new Error(deleteError.message) };
    }

    revalidatePath(`/roadmaps/${post.roadmap_id}/posts/${comment.post_id}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error };
  }
} 