"use client";

import { useState } from "react";
import { Milestone } from "@/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Flag } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export interface TimelineMilestoneProps {
  milestone: Milestone;
  left: number;
  top?: number;
  height: number;
  onEdit?: (milestone: Milestone) => void;
  onDelete?: (milestone: Milestone) => void;
}

export function TimelineMilestone({
  milestone,
  left,
  top = 0,
  height,
  onEdit,
  onDelete,
}: TimelineMilestoneProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Default milestone color if not specified
  const milestoneColor = milestone.color || "#3b82f6";
  
  // Format milestone date
  const formattedDate = milestone.date 
    ? format(new Date(milestone.date), 'MMM d, yyyy')
    : 'No date';

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "absolute flex flex-col items-center",
                  "transition-all duration-100 cursor-pointer",
                  isHovered ? "z-50" : "z-10"
                )}
                style={{
                  left,
                  top,
                  height
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {/* Milestone line */}
                <div 
                  className="w-px h-full z-10"
                  style={{ backgroundColor: milestoneColor }}
                />
                
                {/* Milestone flag */}
                <div 
                  className={cn(
                    "absolute top-0 flex items-center justify-center rounded-sm p-1.5 transform -translate-x-1/2",
                    isHovered ? "shadow-lg" : "shadow-sm"
                  )}
                  style={{ backgroundColor: milestoneColor }}
                >
                  <Flag className="h-3.5 w-3.5 text-white" />
                </div>
                
                {/* Milestone label (only shown when hovered or on wider scales) */}
                {isHovered && (
                  <div 
                    className={cn(
                      "absolute text-xs font-medium whitespace-nowrap",
                      "px-2 py-1 rounded-md transform -translate-x-1/2",
                      "shadow-sm border"
                    )}
                    style={{ 
                      backgroundColor: milestoneColor, 
                      color: "white",
                      top: 30  // Position below the flag icon
                    }}
                  >
                    {milestone.title}
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1.5">
                <div className="font-semibold">{milestone.title}</div>
                {milestone.description && (
                  <div className="text-sm text-muted-foreground">
                    {milestone.description}
                  </div>
                )}
                <div className="flex items-center text-xs font-medium">
                  <span>{formattedDate}</span>
                  {milestone.is_completed && (
                    <span className="ml-2 bg-green-100 text-green-800 rounded-full px-2 py-0.5 text-[10px]">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onEdit?.(milestone)}>
          Edit Milestone
        </ContextMenuItem>
        <ContextMenuItem onClick={() => {
          // Toggle completion logic can go here
          // For now, just call onEdit to update it
          onEdit?.({
            ...milestone,
            is_completed: !milestone.is_completed
          });
        }}>
          {milestone.is_completed ? "Mark as Not Completed" : "Mark as Completed"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onDelete?.(milestone)} className="text-destructive">
          Delete Milestone
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
} 