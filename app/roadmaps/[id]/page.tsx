import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, PencilIcon, UsersIcon } from "lucide-react";

interface RoadmapPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: RoadmapPageProps): Promise<Metadata> {
  const supabase = await createClient();
  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("title")
    .eq("id", params.id)
    .single();

  return {
    title: roadmap?.title || "Roadmap",
    description: "View roadmap details and features",
  };
}

export default async function RoadmapPage({ params }: RoadmapPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: roadmap, error } = await supabase
    .from("roadmaps")
    .select(`
      *,
      profiles:owner_id (
        email,
        display_name
      )
    `)
    .eq("id", params.id)
    .single();

  if (error || !roadmap) {
    notFound();
  }

  // Check if user has access to this roadmap
  const isOwner = user?.id === roadmap.owner_id;
  const isPublic = roadmap.is_public;
  
  if (!isOwner && !isPublic) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{roadmap.title}</h1>
            {roadmap.is_public && (
              <Badge variant="outline">Public</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {roadmap.description || "No description provided"}
          </p>
        </div>
        {isOwner && (
          <Button asChild className="mt-4 md:mt-0">
            <Link href={`/roadmaps/${params.id}/edit`}>
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit Roadmap
            </Link>
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <UsersIcon className="h-4 w-4" />
          <span>Owner: {roadmap.profiles?.display_name || roadmap.profiles?.email}</span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarIcon className="h-4 w-4" />
          <span>Updated {formatDistanceToNow(new Date(roadmap.updated_at), { addSuffix: true })}</span>
        </div>
      </div>
      
      <div className="grid gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No features yet</h3>
            <p className="text-muted-foreground mb-6">
              Start adding features to your roadmap to track your progress.
            </p>
            {isOwner && (
              <Button asChild>
                <Link href={`/roadmaps/${params.id}/features/new`}>
                  Add Feature
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 