import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, PencilIcon, UsersIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { getRoadmapById } from "@/lib/actions/roadmap";
import { getPostsByRoadmapId } from "@/lib/actions/post";
import { getAllStatuses } from "@/lib/actions/status";
import { getAllUsers } from "@/lib/actions/user";
import { PostsList } from "@/components/post/posts-list";
import { Post, Status, User } from "@/types";

interface RoadmapPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  // Await params
  const params_awaited = await params;
  const id = params_awaited.id;
  
  const { data: roadmap } = await getRoadmapById(id);
  
  return {
    title: roadmap ? `${roadmap.title}` : "Roadmap",
    description: roadmap ? `View roadmap: ${roadmap.title}` : "View roadmap details",
  };
}

export default async function RoadmapPage({ params }: { params: { id: string } }) {
  const session = await auth();
  
  if (!session?.id) {
    redirect("/login");
  }
  
  // Await the params
  const params_awaited = await params;
  const id = params_awaited.id;
  
  // Get roadmap
  const { data: roadmap } = await getRoadmapById(id);
  
  if (!roadmap) {
    redirect("/dashboard");
  }
  
  // Get posts
  const posts = await getPostsByRoadmapId(id);
  
  // Get statuses
  const statuses = await getAllStatuses(id);
  
  // Get users
  const users = await getAllUsers();
  
  // Check if user is owner
  const isOwner = roadmap.owner_id === session.id;
  
  return (
    <div className="container py-6">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{roadmap.title}</h1>
              {roadmap.is_public && (
                <Badge variant="outline">Public</Badge>
              )}
            </div>
            {roadmap.description && (
              <p className="text-muted-foreground mt-1">
                {roadmap.description}
              </p>
            )}
          </div>
          
          {isOwner && (
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <Button asChild>
                <Link href={`/roadmaps/${id}/posts/new`}>
                  Add Post
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/roadmaps/${id}/edit`}>
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit Roadmap
                </Link>
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <UsersIcon className="h-4 w-4" />
            <span>Owner: {session.email}</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-4 w-4" />
            <span>Updated {formatDistanceToNow(new Date(roadmap.updated_at), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">No posts yet</h2>
            <p className="text-muted-foreground mb-6">
              Get started by creating your first post
            </p>
            {isOwner && (
              <Button asChild>
                <Link href={`/roadmaps/${id}/posts/new`}>
                  Create Post
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <PostsList 
            posts={posts}
            statuses={statuses}
            users={users}
            roadmapId={id}
          />
        )}
      </div>
    </div>
  );
} 