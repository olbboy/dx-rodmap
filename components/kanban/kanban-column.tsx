"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanCard } from "./kanban-card";
import { Feature } from "@/types";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  features: Feature[];
  roadmapId: string;
  isOwner: boolean;
}

export function KanbanColumn({
  id,
  title,
  color,
  features,
  roadmapId,
  isOwner,
}: KanbanColumnProps) {
  // Make the column sortable
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: "column",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderTopColor: color,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex flex-col w-80 h-[calc(100vh-16rem)] bg-muted/30 rounded-md border shadow-sm border-t-4"
      {...attributes}
    >
      <div
        className="p-3 font-medium flex items-center justify-between border-b bg-muted/20"
        {...listeners}
      >
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
          <h3>{title}</h3>
          <span className="text-xs text-muted-foreground">({features.length})</span>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {features.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 p-3 text-sm text-muted-foreground border border-dashed rounded-md">
            <p>No features in this status</p>
            {isOwner && (
              <Link href={`/roadmaps/${roadmapId}/features/new`}>
                <Button size="sm" variant="ghost" className="mt-2">
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Add feature
                </Button>
              </Link>
            )}
          </div>
        ) : (
          features
            .sort((a, b) => a.order - b.order)
            .map((feature) => (
              <KanbanCard
                key={feature.id}
                feature={feature}
                roadmapId={roadmapId}
                isOwner={isOwner}
              />
            ))
        )}
      </div>

      {isOwner && features.length > 0 && (
        <div className="p-3 border-t">
          <Link href={`/roadmaps/${roadmapId}/features/new?status=${id}`}>
            <Button size="sm" variant="ghost" className="w-full">
              <PlusCircle className="w-4 h-4 mr-1" />
              Add feature
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
} 