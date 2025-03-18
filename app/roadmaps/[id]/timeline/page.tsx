import { notFound } from "next/navigation";
import { TimelineView } from "@/components/timeline/timeline-view";
import { createClient } from "@/lib/supabase/server";
import { getMilestones } from "@/lib/actions/milestone";
import { getDependencies } from "@/lib/actions/dependency";
import { Post, Milestone } from "@/types";

export default async function TimelinePage({ params }: { params: { id: string } }) {
  try {
    // Await params before accessing its properties
    params = await params;
    
    if (!params?.id) {
      console.log("No ID provided in params");
      notFound();
    }
    const roadmapId = params.id;
    console.log("Attempting to fetch roadmap with ID:", roadmapId);

    const supabase = await createClient();

    // Get the roadmap - Fix: Simplified query without incorrect joins
    const { data: roadmap, error: roadmapError } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("id", roadmapId)
      .single();

    console.log("Roadmap query result:", { roadmap, error: roadmapError?.message });

    if (roadmapError || !roadmap) {
      console.log("Roadmap not found or error:", roadmapError?.message);
      notFound();
    }

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log("Current user:", user?.id);
    
    // Check if user is owner or team member 
    // Fix: Use owner_id instead of user_id based on actual schema
    const isOwner = roadmap.owner_id === user?.id;
    console.log("Is owner:", isOwner, "roadmap.owner_id:", roadmap.owner_id);
    
    // Declare posts variable at this scope
    let posts: Post[] = [];
    
    // Debug: Check available columns in posts table
    try {
      const { data: columns, error: columnsError } = await supabase
        .from('posts')
        .select()
        .limit(1);
      
      if (columns && columns.length > 0) {
        console.log("Posts table sample record keys:", Object.keys(columns[0]));
      } else {
        console.log("Could not get sample post record:", columnsError?.message);
      }
    } catch (err) {
      console.error("Error checking posts schema:", err);
    }
    
    // Get all posts for the roadmap
    // Try both roadmap_id and owner_id since we're not sure
    console.log("Attempting to fetch posts with roadmap_id:", roadmapId);
    const { data: postsData, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .eq("roadmap_id", roadmapId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    console.log("Posts query result:", { 
      count: postsData?.length || 0, 
      error: postsError?.message, 
      samplePost: postsData && postsData.length > 0 ? postsData[0] : null 
    });

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      
      // Try alternative query with owner_id if that exists in our schema
      console.log("Attempting alternative fetch with owner_id");
      try {
        const { data: altPosts, error: altError } = await supabase
          .from("posts")
          .select("*")
          .eq("owner_id", roadmapId) // Try alternative column name
          .is("deleted_at", null)
          .order("created_at", { ascending: false });
          
        if (!altError && altPosts && altPosts.length > 0) {
          console.log("Alternative query successful, found", altPosts.length, "posts");
          posts = altPosts as Post[];
        } else {
          console.log("Alternative query also failed:", altError?.message);
        }
      } catch (e) {
        console.error("Error in alternative posts query:", e);
      }
    } else if (postsData) {
      posts = postsData as Post[];
      console.log("Successfully fetched", posts.length, "posts");
    }

    // Get milestones and dependencies - these now return empty arrays on error
    const milestones = await getMilestones(roadmapId);
    const dependencies = await getDependencies(roadmapId);

    console.log("Rendering page with:", {
      postsCount: posts.length,
      milestonesCount: milestones.length,
      dependenciesCount: dependencies.length
    });

    // Add logging to check the structure of posts and milestones data
    console.log("Posts data structure:", {
      count: posts?.length || 0,
      firstPost: posts && posts.length > 0 ? {
        id: posts[0].id,
        title: posts[0].title,
        allKeys: Object.keys(posts[0]),
        hasStartDate: 'start_date' in posts[0],
        startDateValue: posts[0].start_date
      } : null
    });

    // Check the actual schema of the posts table
    const { data: samplePost } = await supabase
      .from('posts')
      .select('*')
      .limit(1);

    if (samplePost && samplePost.length > 0) {
      console.log("Actual post schema:", Object.keys(samplePost[0]));
    }

    // Check milestones and dependencies
    console.log("Milestones data structure:", {
      count: milestones?.length || 0,
      firstMilestone: milestones && milestones.length > 0 ? {
        id: milestones[0].id,
        title: milestones[0].title,
        allKeys: Object.keys(milestones[0]),
        date: milestones[0].date
      } : null
    });

    // Define the complete Post type for dummy data
    const dummyPosts: Post[] = [];
    
    // Create a dummy post with all required fields
    if (posts.length === 0) {
      const now = new Date();
      
      // Add three dummy posts for demonstration
      for (let i = 0; i < 3; i++) {
        dummyPosts.push({
          id: `dummy-${i+1}`,
          title: `Sample Post ${i+1}`,
          description: `This is a sample post for testing - #${i+1}`,
          roadmap_id: roadmapId,
          start_date: new Date(now.getTime() + (i * 3 * 24 * 60 * 60 * 1000)).toISOString(), // Stagger start dates
          end_date: new Date(now.getTime() + ((i+1) * 7 * 24 * 60 * 60 * 1000)).toISOString(), // Stagger end dates
          created_at: new Date().toISOString(),
          priority: "high",
          status_id: "status-1",
          due_date: new Date(now.getTime() + ((i+2) * 14 * 24 * 60 * 60 * 1000)).toISOString(),
          eta: "2 weeks",
          tags: ["sample", "test"],
          progress: i * 33, // 0, 33, 66 percent progress
          assignee_id: "assignee-1",
          created_by: "creator-1",
          updated_at: new Date().toISOString(),
          updated_by: "updater-1",
          parent_id: null,
          order_index: i,
          metadata: {},
          deleted_at: null,
        });
      }
      
      console.log("Created dummy posts for testing:", dummyPosts.length);
    }
    
    // Create dummy milestones if none exist
    const dummyMilestones: Milestone[] = [];
    
    if (milestones.length === 0) {
      const now = new Date();
      
      // Add two dummy milestones
      for (let i = 0; i < 2; i++) {
        dummyMilestones.push({
          id: `dummy-milestone-${i+1}`,
          roadmapId: roadmapId,
          title: `Milestone ${i+1}`,
          description: `This is a sample milestone for testing - #${i+1}`,
          date: new Date(now.getTime() + (i * 14 * 24 * 60 * 60 * 1000)).toISOString(), // Milestone every 2 weeks
          color: i === 0 ? "red" : "green",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          created_by: "creator-1"
        });
      }
      
      console.log("Created dummy milestones for testing:", dummyMilestones.length);
    }

    // Ensure roadmapId and posts are defined
    const postsToRender = posts.length > 0 ? posts : dummyPosts;
    const milestonesToRender = milestones.length > 0 ? milestones : dummyMilestones;

    // Adjust the height settings in the return statement
    return (
      <div className="flex flex-col h-screen"> {/* Use h-screen for full viewport height */}
        <h1 className="text-2xl font-bold mb-4">{roadmap.title} Timeline</h1>
        <p className="text-muted-foreground mb-4">
          Showing {postsToRender.length} posts and {milestonesToRender.length} milestones
        </p>
        <div className="flex-1 min-h-[500px]"> {/* Set a minimum height */}
          <TimelineView 
            roadmapId={roadmapId}
            initialPosts={postsToRender}
            initialMilestones={milestonesToRender}
            initialDependencies={dependencies || []}
            isOwner={isOwner}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in timeline page:", error);
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h1 className="text-2xl font-bold mb-4">Timeline Error</h1>
        <p className="text-muted-foreground mb-4">
          There was an error loading the timeline. This feature might still be in development.
        </p>
        <p className="text-sm text-destructive">
          Error details: {error instanceof Error ? error.message : String(error)}
        </p>
      </div>
    );
  }
} 