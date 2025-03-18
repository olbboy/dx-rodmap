import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Users, Kanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Roadmap {
  id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  owner_id: string;
}

interface RoadmapListProps {
  roadmaps: Roadmap[];
}

export function RoadmapList({ roadmaps }: RoadmapListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {roadmaps.map((roadmap) => (
        <Card key={roadmap.id} className="flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-lg font-medium">
                <Link
                  href={`/roadmaps/${roadmap.id}`}
                  className="hover:underline"
                >
                  {roadmap.title}
                </Link>
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {roadmap.description || "No description"}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/roadmaps/${roadmap.id}`}>View</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/roadmaps/${roadmap.id}/kanban`}>
                    <Kanban className="mr-2 h-4 w-4" />
                    Kanban Board
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/roadmaps/${roadmap.id}/edit`}>Edit</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/roadmaps/${roadmap.id}/settings`}>Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Team</span>
              {roadmap.is_public && (
                <Badge variant="outline" className="ml-2">
                  Public
                </Badge>
              )}
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(new Date(roadmap.updated_at), { addSuffix: true })}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 