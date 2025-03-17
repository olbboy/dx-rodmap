import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, PencilIcon, UsersIcon } from "lucide-react";
import { FeatureList } from "@/components/feature/feature-list";
import { Feature, Status, Tag } from "@/types";

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

  // Fetch features
  const { data: features = [] } = await supabase
    .from("features")
    .select(`
      *,
      status:status_id (
        id,
        name,
        color
      ),
      assignee:assignee_id (
        id,
        email,
        display_name
      )
    `)
    .eq("roadmap_id", params.id)
    .order("order", { ascending: true });

  // Get tags for features
  let featureTags: Record<string, any[]> = {};
  
  if (features && features.length > 0) {
    const featureIds = features.map(feature => feature.id);
    
    const { data: tagRelations = [] } = await supabase
      .from("feature_tags")
      .select(`
        feature_id,
        tag:tag_id (
          id,
          name,
          color
        )
      `)
      .in("feature_id", featureIds);
    
    // Group tags by feature
    if (tagRelations) {
      featureTags = tagRelations.reduce((acc: Record<string, any[]>, rel: any) => {
        if (!acc[rel.feature_id]) {
          acc[rel.feature_id] = [];
        }
        acc[rel.feature_id].push(rel.tag);
        return acc;
      }, {});
    }
  }

  // Attach tags to features
  const featuresWithTags = features ? features.map(feature => ({
    ...feature,
    tags: featureTags[feature.id] || []
  })) : [];

  // Fetch statuses
  const { data: statuses = [] } = await supabase
    .from("statuses")
    .select("*")
    .eq("roadmap_id", params.id)
    .order("order", { ascending: true });

  // Fetch tags
  const { data: tags = [] } = await supabase
    .from("tags")
    .select("*")
    .eq("roadmap_id", params.id)
    .order("name", { ascending: true });

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
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Button asChild>
              <Link href={`/roadmaps/${params.id}/features/new`}>
                Add Feature
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/roadmaps/${params.id}/edit`}>
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
          {featuresWithTags && featuresWithTags.length > 0 ? (
            <FeatureList 
              features={featuresWithTags as Feature[]} 
              roadmapId={params.id} 
              statuses={statuses as Status[]} 
              tags={tags as Tag[]} 
              isOwner={isOwner} 
            />
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
} 