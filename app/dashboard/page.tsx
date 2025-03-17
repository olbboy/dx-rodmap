import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { RoadmapList } from "@/components/roadmap/roadmap-list";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your roadmap dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch user's roadmaps
  const { data: roadmaps } = await supabase
    .from("roadmaps")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email}
          </p>
        </div>
        <Button asChild className="mt-4 md:mt-0">
          <Link href="/roadmaps/new">
            <PlusIcon className="mr-2 h-4 w-4" />
            New Roadmap
          </Link>
        </Button>
      </div>
      
      <div className="grid gap-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Your Roadmaps</h2>
          {roadmaps && roadmaps.length > 0 ? (
            <RoadmapList roadmaps={roadmaps} />
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No roadmaps yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first roadmap to get started with planning your projects.
              </p>
              <Button asChild>
                <Link href="/roadmaps/new">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Roadmap
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
