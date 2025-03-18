"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, MoreHorizontal, PencilIcon, Trash } from "lucide-react";
import { DeleteFeatureButton } from "@/components/feature/delete-feature-button";
import { Feature } from "@/types";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  feature: Feature;
  roadmapId: string;
  isOwner: boolean;
}

export function KanbanCard({ feature, roadmapId, isOwner }: KanbanCardProps) {
  // Make the card sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: feature.id,
    data: {
      type: "card",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "shadow-sm cursor-grab active:cursor-grabbing",
        isDragging ? "border-primary" : "border-border"
      )}
      {...attributes}
      {...listeners}
    >
      <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between space-y-0">
        <CardTitle className="text-sm font-medium">{feature.title}</CardTitle>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/roadmaps/${roadmapId}/features/${feature.id}/edit`}>
                <DropdownMenuItem>
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </Link>
              <DeleteFeatureButton
                featureId={feature.id}
                featureTitle={feature.title}
                asDropdownItem
              />
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {feature.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {feature.description}
          </p>
        )}
      </CardContent>
      <CardFooter className="p-3 pt-0 flex flex-col items-start gap-2">
        {feature.due_date && (
          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="mr-1 h-3 w-3" />
            {format(new Date(feature.due_date), "MMM d, yyyy")}
          </div>
        )}
        {feature.tags && feature.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {feature.tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-[10px] px-1 py-0 h-auto"
                style={{ 
                  borderColor: tag.color,
                  color: tag.color,
                  backgroundColor: `${tag.color}10`
                }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
        {feature.assignee && (
          <div className="flex items-center gap-1 mt-1">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted">
              <span className="text-[10px]">
                {feature.assignee.display_name?.[0] || feature.assignee.email[0]}
              </span>
            </div>
            <span className="text-xs truncate max-w-[160px]">
              {feature.assignee.display_name || feature.assignee.email}
            </span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 