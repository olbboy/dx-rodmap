import { redirect } from "next/navigation";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { getFeaturesByRoadmapId } from "@/lib/actions/feature";
import { getStatusesByRoadmapId } from "@/lib/actions/status";
import { getRoadmapById } from "@/lib/actions/roadmap";
import { createClient } from "@/lib/supabase/server";

export default async function KanbanPage({ params }: { params: { id: string } }) {
  try {
    console.log("KanbanPage: Starting with params:", params);
    params = await params;
    const id = params.id;
    console.log(`KanbanPage: Processing roadmap ID: ${id}`);
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    console.log(`KanbanPage: Current user: ${user?.id}`);
    
    if (!user) {
      console.log("KanbanPage: No authenticated user, redirecting to signin");
      redirect("/auth/signin");
    }

    // Get the roadmap data
    console.log(`KanbanPage: Fetching roadmap data for ID: ${id}`);
    const roadmap = await getRoadmapById(id);
    
    if (!roadmap) {
      console.log(`KanbanPage: Roadmap not found for ID: ${id}, redirecting to dashboard`);
      redirect("/dashboard");
    }

    console.log(`KanbanPage: Roadmap found:`, roadmap);

    // Check if current user is the roadmap owner or collaborator
    const isOwner = roadmap.owner_id === user.id;
    const isCollaborator = false; // TODO: Implement collaborator check in Sprint 5
    
    console.log(`KanbanPage: Access check - isOwner: ${isOwner}, isCollaborator: ${isCollaborator}, isPublic: ${roadmap.is_public}`);

    // If the roadmap is not public, and the user is not the owner or collaborator, redirect
    if (!roadmap.is_public && !isOwner && !isCollaborator) {
      console.log(`KanbanPage: Access denied for user ${user.id} to roadmap ${id}, redirecting to dashboard`);
      redirect("/dashboard");
    }

    // Get all statuses for the roadmap
    const statuses = await getStatusesByRoadmapId(id);
    
    // Get all features for the roadmap
    const features = await getFeaturesByRoadmapId(id);

    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{roadmap.title} - Kanban View</h1>
        </div>
        
        <KanbanBoard 
          roadmapId={id} 
          initialFeatures={features} 
          statuses={statuses} 
          isOwner={isOwner} 
        />
      </div>
    );
  } catch (error) {
    console.error("KanbanPage: Error processing request", error);
    redirect("/dashboard");
  }
} 