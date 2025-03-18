import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FeatureForm } from "@/components/feature/feature-form";
import { Status, Tag, User } from "@/types";

interface NewFeaturePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: NewFeaturePageProps): Promise<Metadata> {
  params = await params;
  const id = params.id;
  
  const supabase = await createClient();
  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("title")
    .eq("id", id)
    .single();

  return {
    title: `Add Feature to ${roadmap?.title || "Roadmap"}`,
    description: "Add a new feature to your roadmap",
  };
}

export default async function NewFeaturePage({ params }: NewFeaturePageProps) {
  params = await params;
  const id = params.id;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    notFound();
  }
  
  const { data: roadmap, error: roadmapError } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (roadmapError || !roadmap) {
    notFound();
  }

  // Fetch statuses
  let { data: statuses = [] } = await supabase
    .from("statuses")
    .select("*")
    .eq("roadmap_id", id)
    .order("order", { ascending: true });
  
  // Ensure statuses is an array
  if (!statuses) statuses = [];

  // If no statuses exist, create default ones
  if (statuses.length === 0) {
    const defaultStatuses = [
      { name: "To Do", color: "#4299e1", order: 0 },
      { name: "In Progress", color: "#ed8936", order: 1 },
      { name: "Done", color: "#48bb78", order: 2 },
    ];

    for (const status of defaultStatuses) {
      await supabase
        .from("statuses")
        .insert({
          roadmap_id: id,
          name: status.name,
          color: status.color,
          order: status.order,
        });
    }

    // Fetch again after creation
    const { data: newStatuses = [] } = await supabase
      .from("statuses")
      .select("*")
      .eq("roadmap_id", id)
      .order("order", { ascending: true });
      
    if (newStatuses) {
      statuses = [...newStatuses];
    }
  }

  // Fetch tags
  const { data: tags = [] } = await supabase
    .from("tags")
    .select("*")
    .eq("roadmap_id", id)
    .order("name", { ascending: true });

  // Fetch assignable users (currently just the owner, but could be expanded for teams)
  const { data: users = [] } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .eq("id", user.id);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Add Feature</h1>
        <p className="text-muted-foreground">
          Add a new feature to your {roadmap.title} roadmap.
        </p>
      </div>
      <div className="grid gap-6">
        <div className="rounded-lg border bg-card p-6">
          <FeatureForm 
            roadmapId={id} 
            statuses={statuses as Status[]} 
            tags={(tags || []) as Tag[]} 
            users={(users || []) as User[]} 
          />
        </div>
      </div>
    </div>
  );
} 