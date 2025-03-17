import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RoadmapForm } from "@/components/roadmap/roadmap-form";

interface EditRoadmapPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: EditRoadmapPageProps): Promise<Metadata> {
  const supabase = await createClient();
  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("title")
    .eq("id", params.id)
    .single();

  return {
    title: `Edit ${roadmap?.title || "Roadmap"}`,
    description: "Edit your roadmap details",
  };
}

export default async function EditRoadmapPage({ params }: EditRoadmapPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    notFound();
  }
  
  const { data: roadmap, error } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .single();

  if (error || !roadmap) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Edit Roadmap</h1>
        <p className="text-muted-foreground">
          Update your roadmap details and settings.
        </p>
      </div>
      <div className="grid gap-6">
        <div className="rounded-lg border bg-card p-6">
          <RoadmapForm roadmap={roadmap} />
        </div>
      </div>
    </div>
  );
} 