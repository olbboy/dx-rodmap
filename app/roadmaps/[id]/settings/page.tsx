import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { StatusFormDialog } from "@/components/status-form-dialog";
import { TagFormDialog } from "@/components/feature/tag-form-dialog";
import { Status, Tag } from "@/types";

interface SettingsPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: SettingsPageProps): Promise<Metadata> {
  params = await params;
  const id = params.id;
  
  const supabase = await createClient();
  const { data: roadmap } = await supabase
    .from("roadmaps")
    .select("title")
    .eq("id", id)
    .single();

  return {
    title: `Settings - ${roadmap?.title || "Roadmap"}`,
    description: "Manage roadmap settings, statuses, and tags",
  };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
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
  const { data: statuses = [] } = await supabase
    .from("statuses")
    .select("*")
    .eq("roadmap_id", id)
    .order("order", { ascending: true });

  // Fetch tags
  const { data: tags = [] } = await supabase
    .from("tags")
    .select("*")
    .eq("roadmap_id", id)
    .order("name", { ascending: true });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="text-muted-foreground">
        Manage settings for the {roadmap.title} roadmap.
      </p>
      
      <div className="space-y-8">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Statuses</h2>
            <StatusFormDialog roadmapId={id}>
              <Button variant="outline" size="sm" className="gap-1">
                <PlusIcon className="h-4 w-4" />
                Add Status
              </Button>
            </StatusFormDialog>
          </div>
          
          <div className="space-y-4">
            {statuses && statuses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {statuses.map((status: Status) => (
                  <div
                    key={status.id}
                    className="flex items-center justify-between rounded-md border p-4"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span>{status.name}</span>
                    </div>
                    <StatusFormDialog
                      roadmapId={id}
                      status={status}
                    >
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </StatusFormDialog>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-md p-4 text-center text-muted-foreground">
                No statuses defined yet. Click "Add Status" to create one.
              </div>
            )}
          </div>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Tags</h2>
            <TagFormDialog roadmapId={id}>
              <Button variant="outline" size="sm" className="gap-1">
                <PlusIcon className="h-4 w-4" />
                Add Tag
              </Button>
            </TagFormDialog>
          </div>
          
          <div className="space-y-4">
            {tags && tags.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {tags.map((tag: Tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between rounded-md border p-4"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span>{tag.name}</span>
                    </div>
                    <TagFormDialog
                      roadmapId={id}
                      tag={tag}
                    >
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TagFormDialog>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border rounded-md p-4 text-center text-muted-foreground">
                No tags defined yet. Click "Add Tag" to create one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 