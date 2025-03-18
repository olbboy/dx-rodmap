import { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, Kanban, LayoutGrid, Settings, ChartGantt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RoadmapLayoutProps {
  children: ReactNode;
  params: {
    id: string;
  };
}

export default async function RoadmapLayout({ children, params }: RoadmapLayoutProps) {
  params = await params;
  const id = params.id;

  return (
    <div>
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard" className="flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </Button>
        
        <Tabs defaultValue="view">
          <TabsList>
            <TabsTrigger value="view" asChild>
              <Link href={`/roadmaps/${id}`}>
                <LayoutGrid className="h-4 w-4 mr-1" />
                List View
              </Link>
            </TabsTrigger>
            <TabsTrigger value="kanban" asChild>
              <Link href={`/roadmaps/${id}/kanban`}>
                <Kanban className="h-4 w-4 mr-1" />
                Kanban
              </Link>
            </TabsTrigger>
            <TabsTrigger value="timeline" asChild>
              <Link href={`/roadmaps/${id}/timeline`}>
                <ChartGantt className="h-4 w-4 mr-1" />
                Timeline
              </Link>
            </TabsTrigger>
            <TabsTrigger value="settings" asChild>
              <Link href={`/roadmaps/${id}/settings`}>
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {children}
    </div>
  );
} 