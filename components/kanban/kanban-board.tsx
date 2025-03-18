"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { 
  SortableContext, 
  horizontalListSortingStrategy,
  arrayMove
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { updateFeatureStatus } from "@/lib/actions/feature";
import { Feature, Status } from "@/types";

interface KanbanBoardProps {
  roadmapId: string;
  initialFeatures: Feature[];
  statuses: Status[];
  isOwner: boolean;
}

export function KanbanBoard({ 
  roadmapId, 
  initialFeatures, 
  statuses, 
  isOwner 
}: KanbanBoardProps) {
  // State for features grouped by status
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
  const [activeFeature, setActiveFeature] = useState<Feature | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Organize features by status
  const featuresByStatus = statuses.reduce<Record<string, Feature[]>>(
    (acc, status) => {
      acc[status.id] = features.filter(
        (feature) => feature.status_id === status.id
      );
      return acc;
    },
    {}
  );

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedFeature = features.find(
      (feature) => feature.id === active.id
    );
    
    if (draggedFeature) {
      setActiveFeature(draggedFeature);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !active) return;
    
    const activeFeatureId = active.id as string;
    const overId = over.id as string;
    
    // If dropped in a different status column
    if (over.data?.current?.type === "column" && activeFeature) {
      const newStatusId = overId;
      const oldStatusId = activeFeature.status_id;
      
      if (newStatusId === oldStatusId) return;
      
      setIsLoading(true);
      
      // Find the highest order in the new status column
      const featuresInTargetStatus = featuresByStatus[newStatusId] || [];
      const newOrder = featuresInTargetStatus.length 
        ? Math.max(...featuresInTargetStatus.map(f => f.order)) + 1
        : 0;
      
      // Update the feature status and order
      try {
        const result = await updateFeatureStatus(
          activeFeatureId,
          newStatusId,
          newOrder
        );
        
        if (result.error) {
          toast.error("Failed to update feature status");
          console.error(result.error);
          return;
        }
        
        // Update local state with optimistic UI update
        setFeatures(prevFeatures => 
          prevFeatures.map(feature => 
            feature.id === activeFeatureId
              ? { ...feature, status_id: newStatusId, order: newOrder }
              : feature
          )
        );
        
        toast.success("Feature updated");
      } catch (error) {
        console.error("Error updating feature status:", error);
        toast.error("Failed to update feature status");
      } finally {
        setIsLoading(false);
        setActiveFeature(null);
      }
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-4 min-w-max">
          <SortableContext
            items={statuses.map((status) => status.id)}
            strategy={horizontalListSortingStrategy}
          >
            {statuses.map((status) => (
              <KanbanColumn
                key={status.id}
                id={status.id}
                title={status.name}
                color={status.color}
                features={featuresByStatus[status.id] || []}
                roadmapId={roadmapId}
                isOwner={isOwner}
              />
            ))}
          </SortableContext>
        </div>

        {/* Drag overlay for the currently dragged card */}
        <DragOverlay>
          {activeFeature && (
            <KanbanCard
              feature={activeFeature}
              roadmapId={roadmapId}
              isOwner={isOwner}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
} 