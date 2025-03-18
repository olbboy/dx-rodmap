import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoadmapById } from "@/lib/actions/roadmap";
import { getPostById } from "@/lib/actions/post";
import { getStatuses } from "@/lib/actions/status";
import { getAllUsers } from "@/lib/actions/user";
import { PostForm } from "@/components/post/post-form";

export const metadata = {
  title: "Edit Post",
  description: "Edit post details",
};

export default async function EditPostPage(props: {
  params: { id: string; postId: string };
}) {
  const session = await auth();
  
  if (!session?.id) {
    redirect("/login");
  }

  // Await the params
  const params = await props.params;
  const { id, postId } = params;
  
  // Get roadmap
  const { data: roadmap } = await getRoadmapById(id);
  
  if (!roadmap) {
    redirect("/dashboard");
  }
  
  // Check if user is owner
  if (roadmap.owner_id !== session.id) {
    redirect(`/roadmaps/${id}`);
  }
  
  // Get post
  const post = await getPostById(postId);
  
  if (!post) {
    notFound();
  }
  
  // Ensure post belongs to this roadmap
  if (post.roadmap_id !== id) {
    redirect(`/roadmaps/${id}`);
  }
  
  // Get statuses
  const statuses = await getStatuses(id);
  
  // Get users
  const users = await getAllUsers();
  
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Edit Post</h1>
      <PostForm 
        roadmapId={id}
        postId={postId}
        statuses={statuses}
        users={users}
        initialValues={{
          title: post.title,
          description: post.description || "",
          status_id: post.status_id,
          assignee_id: post.assignee_id || "",
          start_date: post.start_date || "",
          end_date: post.end_date || "",
          eta: post.eta || "",
          priority: post.priority || undefined,
          progress: post.progress || 0,
          tags: post.tags || []
        }}
      />
    </div>
  );
} 