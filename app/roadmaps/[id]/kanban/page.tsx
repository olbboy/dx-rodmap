import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRoadmapById } from "@/lib/actions/roadmap";
import { getPostsByRoadmapId } from "@/lib/actions/post";
import { getStatuses } from "@/lib/actions/status";
import { getAllUsers } from "@/lib/actions/user";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export const metadata = {
  title: "Kanban Board",
  description: "Manage posts using the kanban board",
};

export default async function KanbanPage(props: {
  params: { id: string };
}) {
  const session = await auth();
  
  if (!session?.id) {
    redirect("/login");
  }

  // Await the params object
  const params = await props.params;
  const id = params.id;
  
  // Get roadmap
  const { data: roadmap } = await getRoadmapById(id);
  
  if (!roadmap) {
    redirect("/dashboard");
  }
  
  // Get posts
  const posts = await getPostsByRoadmapId(id);
  
  // Get statuses
  const statuses = await getStatuses(id);
  
  // If no statuses, redirect to settings to create some
  if (!statuses.length) {
    redirect(`/roadmaps/${id}/settings?tab=statuses`);
  }
  
  // Get users
  const users = await getAllUsers();
  
  // Determine if user is owner
  const isOwner = roadmap.owner_id === session.id;
  
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Kanban Board</h1>
      <KanbanBoard 
        posts={posts} 
        statuses={statuses}
        users={users}
        roadmapId={id}
        isOwner={isOwner}
      />
    </div>
  );
} 