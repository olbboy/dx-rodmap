import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoadmapById } from "@/lib/actions/roadmap";
import { getStatusesByRoadmapId } from "@/lib/actions/status";
import { getTagsByRoadmapId } from "@/lib/actions/tag";
import { getAllUsers } from "@/lib/actions/user";
import { PostForm } from "@/components/post/post-form";

export const metadata = {
  title: "New Post",
  description: "Create a new post for your roadmap",
};

export default async function NewPostPage(props: {
  params: { id: string };
  searchParams: { status?: string };
}) {
  const session = await auth();
  
  if (!session?.id) {
    redirect("/login");
  }

  // Await the params object
  const params = await props.params;
  const id = params.id;
  const { status: initialStatusId } = props.searchParams;
  
  // Get roadmap
  const { data: roadmap } = await getRoadmapById(id);
  
  if (!roadmap) {
    redirect("/dashboard");
  }
  
  // Check if user is owner
  if (roadmap.owner_id !== session.id) {
    redirect(`/roadmaps/${id}`);
  }
  
  // Fetch statuses, users, and tags in parallel
  const [statuses, users, tagsResult] = await Promise.all([
    getStatusesByRoadmapId(params.id),
    getAllUsers(),
    getTagsByRoadmapId(params.id)
  ]);
  
  // If no statuses, redirect to settings to create some
  if (!statuses.length) {
    redirect(`/roadmaps/${id}/settings?tab=statuses`);
  }
  
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Create New Post</h1>
        <p className="text-muted-foreground">
          Add a new post to {roadmap.title}
        </p>
      </div>
      <PostForm
        roadmapId={params.id}
        statuses={statuses || []}
        users={users || []}
        availableTags={tagsResult?.data || []}
        initialValues={{
          title: "",
          description: "",
          status_id: initialStatusId || (statuses.length > 0 ? statuses[0].id : ""),
          assignee_id: "",
          start_date: "",
          end_date: "",
          eta: "",
          priority: undefined,
          progress: 0,
          tags: []
        }}
      />
    </div>
  );
} 