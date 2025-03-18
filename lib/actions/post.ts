"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Post } from "@/types";
import { auth } from "@/lib/auth";
import { getRoadmapById } from "./roadmap";

export interface PostFormData {
  title: string;
  description?: string;
  status_id: string;
  assignee_id?: string;
  start_date?: string;
  end_date?: string;
  eta?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  progress?: number;
  parent_id?: string;
}

export async function getPostsByRoadmapId(roadmapId: string): Promise<Post[]> {
  try {
    console.log(`Getting posts for roadmap ID: ${roadmapId}`);
    const supabase = await createClient();
    
    // Fetch posts without using relationships (avoiding foreign key issues)
    const { data: posts, error } = await supabase
      .from("posts")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .is("deleted_at", null)
      .order("order_index");
    
    if (error) {
      console.error("Error fetching posts:", error);
      return [];
    }
    
    // Early return if no posts
    if (!posts || posts.length === 0) {
      console.log("No posts found for this roadmap");
      return [];
    }
    
    // Get the unique status IDs and assignee IDs to fetch in batch
    const statusIds = [...new Set(posts.map(post => post.status_id).filter(Boolean))];
    const assigneeIds = [...new Set(posts.map(post => post.assignee_id).filter(Boolean))];
    const creatorIds = [...new Set(posts.map(post => post.created_by).filter(Boolean))];
    const updaterIds = [...new Set(posts.map(post => post.updated_by).filter(Boolean))];
    
    // Fetch all statuses for these posts
    const { data: statuses } = await supabase
      .from("statuses")
      .select("*")
      .in("id", statusIds);
    
    // Fetch all users involved (assignees, creators, updaters)
    const { data: users } = await supabase
      .from("users")
      .select("id, email, display_name, avatar_url")
      .in("id", [...new Set([...assigneeIds, ...creatorIds, ...updaterIds])]);
    
    // Create lookup maps
    const statusMap = statuses?.reduce((acc, status) => {
      acc[status.id] = status;
      return acc;
    }, {} as Record<string, any>) || {};
    
    const userMap = users?.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, any>) || {};
    
    // Enrich posts with status and user data
    const enrichedPosts = posts.map(post => ({
      ...post,
      status: post.status_id ? statusMap[post.status_id] : null,
      assignee: post.assignee_id ? userMap[post.assignee_id] : null,
      creator: post.created_by ? userMap[post.created_by] : null,
      updater: post.updated_by ? userMap[post.updated_by] : null,
    }));
    
    console.log(`Found ${enrichedPosts.length} posts`);
    return enrichedPosts;
  } catch (error) {
    console.error("Error in getPostsByRoadmapId:", error);
    return [];
  }
}

export async function getPostById(postId: string): Promise<Post | null> {
  try {
    const supabase = await createClient();
    
    // Fetch the post without relationships
    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", postId)
      .is("deleted_at", null)
      .single();
    
    if (error) {
      console.error("Error fetching post:", error);
      return null;
    }
    
    if (!post) {
      return null;
    }
    
    // Fetch the status
    let status = null;
    if (post.status_id) {
      const { data: statusData } = await supabase
        .from("statuses")
        .select("*")
        .eq("id", post.status_id)
        .single();
      status = statusData;
    }
    
    // Fetch user data
    const userIds = [
      post.assignee_id, 
      post.created_by, 
      post.updated_by
    ].filter(Boolean);
    
    let userMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, email, display_name, avatar_url")
        .in("id", [...new Set(userIds)]);
      
      userMap = users?.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>) || {};
    }
    
    // Enrich the post with related data
    const enrichedPost = {
      ...post,
      status,
      assignee: post.assignee_id ? userMap[post.assignee_id] : null,
      creator: post.created_by ? userMap[post.created_by] : null,
      updater: post.updated_by ? userMap[post.updated_by] : null,
    };
    
    return enrichedPost;
  } catch (error) {
    console.error("Error in getPostById:", error);
    return null;
  }
}

export async function createPost(
  roadmapId: string,
  data: PostFormData
): Promise<{ data: Post | null; error: Error | null }> {
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

    // Get max order for this status to place the new post at the end
    const { data: maxOrderPost } = await supabase
      .from("posts")
      .select("order_index")
      .eq("roadmap_id", roadmapId)
      .eq("status_id", data.status_id)
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = maxOrderPost ? maxOrderPost.order_index + 1 : 0;

    // Create the post
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        roadmap_id: roadmapId,
        title: data.title,
        description: data.description || null,
        status_id: data.status_id,
        assignee_id: data.assignee_id || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        eta: data.eta || null,
        tags: data.tags || [],
        priority: data.priority || null,
        progress: data.progress || 0,
        parent_id: data.parent_id || null,
        order_index: nextOrder,
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single();

    if (postError) {
      return { data: null, error: new Error(postError.message) };
    }

    revalidatePath(`/roadmaps/${roadmapId}`);
    return { data: post, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

export async function updatePost(
  postId: string,
  data: PostFormData
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: new Error("Not authenticated") };
    }

    // Get post to check ownership
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("roadmap_id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return { success: false, error: new Error("Post not found") };
    }

    // Check if user owns the roadmap
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .select("owner_id")
      .eq("id", post.roadmap_id)
      .single();

    if (roadmapError || !roadmap) {
      return { success: false, error: new Error("Roadmap not found") };
    }

    if (roadmap.owner_id !== user.id) {
      return { success: false, error: new Error("Not authorized") };
    }

    // Update the post
    const { error: updateError } = await supabase
      .from("posts")
      .update({
        title: data.title,
        description: data.description || null,
        status_id: data.status_id,
        assignee_id: data.assignee_id || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        eta: data.eta || null,
        tags: data.tags || [],
        priority: data.priority || null,
        progress: data.progress || null,
        parent_id: data.parent_id || null,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", postId);

    if (updateError) {
      return { success: false, error: new Error(updateError.message) };
    }

    revalidatePath(`/roadmaps/${post.roadmap_id}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error };
  }
}

export async function deletePost(
  postId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: new Error("Not authenticated") };
    }

    // Get post to check ownership
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("roadmap_id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return { success: false, error: new Error("Post not found") };
    }

    // Check if user owns the roadmap
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .select("owner_id")
      .eq("id", post.roadmap_id)
      .single();

    if (roadmapError || !roadmap) {
      return { success: false, error: new Error("Roadmap not found") };
    }

    if (roadmap.owner_id !== user.id) {
      return { success: false, error: new Error("Not authorized") };
    }

    // Soft delete the post by setting deleted_at
    const { error: deleteError } = await supabase
      .from("posts")
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq("id", postId);

    if (deleteError) {
      return { success: false, error: new Error(deleteError.message) };
    }

    revalidatePath(`/roadmaps/${post.roadmap_id}`);
    return { success: true, error: null };
  } catch (error: any) {
    return { success: false, error };
  }
}

/**
 * Updates the status of a post
 */
export async function updatePostStatus(
  postId: string,
  statusId: string,
  order?: number | null
) {
  try {
    const session = await auth();
    
    if (!session?.id) {
      return { success: false, error: { message: "Unauthorized" } };
    }
    
    const post = await getPostById(postId);
    
    if (!post) {
      return { success: false, error: { message: "Post not found" } };
    }
    
    // Check if user is owner of roadmap
    const { data: roadmap } = await getRoadmapById(post.roadmap_id);
    
    if (!roadmap || roadmap.owner_id !== session.id) {
      return { success: false, error: { message: "You don't have permission to update this post" } };
    }
    
    // Update post status
    const supabase = await createClient();
    const { error } = await supabase
      .from("posts")
      .update({ 
        status_id: statusId,
        ...(order !== undefined && { order }),
        updated_at: new Date().toISOString()
      })
      .eq("id", postId);
    
    if (error) {
      return { success: false, error: { message: error.message } };
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
} 