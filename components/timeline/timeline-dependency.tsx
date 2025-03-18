"use client";

import { useState } from "react";
import { Dependency, DependencyType, Post } from "@/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X } from "lucide-react";

export interface TimelineDependencyProps {
  dependency: Dependency;
  sourcePost: Post;
  targetPost: Post;
  sourceRect: { left: number; width: number; top: number; height: number };
  targetRect: { left: number; width: number; top: number; height: number };
  onDelete?: (dependency: Dependency) => void;
}

export function TimelineDependency({
  dependency,
  sourcePost,
  targetPost,
  sourceRect,
  targetRect,
  onDelete,
}: TimelineDependencyProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Path generation for different dependency types
  const buildPath = () => {
    const sourceCenterX = sourceRect.left + sourceRect.width / 2;
    const sourceCenterY = sourceRect.top + sourceRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;
    
    // Determine connection points based on relative positions
    let sourceX = sourceCenterX;
    let sourceY = sourceCenterY;
    let targetX = targetCenterX;
    let targetY = targetCenterY;
    
    // Adjust connection points to edges of boxes
    if (sourceRect.top > targetRect.top + targetRect.height) {
      // Source is below target
      sourceY = sourceRect.top;
      targetY = targetRect.top + targetRect.height;
    } else if (targetRect.top > sourceRect.top + sourceRect.height) {
      // Target is below source
      sourceY = sourceRect.top + sourceRect.height;
      targetY = targetRect.top;
    }
    
    if (sourceRect.left + sourceRect.width < targetRect.left) {
      // Source is to the left of target
      sourceX = sourceRect.left + sourceRect.width;
      targetX = targetRect.left;
    } else if (targetRect.left + targetRect.width < sourceRect.left) {
      // Target is to the left of source
      sourceX = sourceRect.left;
      targetX = targetRect.left + targetRect.width;
    }
    
    // Calculate control points for the curve
    const dx = Math.abs(targetX - sourceX);
    const dy = Math.abs(targetY - sourceY);
    const curveFactor = Math.min(dx, 100) / 2;
    
    let sourceControlX, sourceControlY, targetControlX, targetControlY;
    
    if (sourceX !== sourceRect.left + sourceRect.width / 2 || 
        targetX !== targetRect.left + targetRect.width / 2) {
      // Horizontal connection
      sourceControlX = sourceX + Math.sign(targetX - sourceX) * curveFactor;
      sourceControlY = sourceY;
      targetControlX = targetX - Math.sign(targetX - sourceX) * curveFactor;
      targetControlY = targetY;
    } else {
      // Vertical connection
      sourceControlX = sourceX;
      sourceControlY = sourceY + Math.sign(targetY - sourceY) * curveFactor;
      targetControlX = targetX;
      targetControlY = targetY - Math.sign(targetY - sourceY) * curveFactor;
    }
    
    return `M ${sourceX} ${sourceY} C ${sourceControlX} ${sourceControlY}, ${targetControlX} ${targetControlY}, ${targetX} ${targetY}`;
  };

  // Determine dependency color based on type
  const getDependencyColor = () => {
    switch (dependency.dependencyType) {
      case DependencyType.FinishToStart:
        return "#ef4444"; // Red for blocking dependencies
      case DependencyType.StartToStart:
        return "#f97316"; // Orange for start to start
      case DependencyType.FinishToFinish:
        return "#3b82f6"; // Blue for finish to finish
      case DependencyType.StartToFinish:
        return "#8b5cf6"; // Purple for start to finish
      default:
        return "#64748b"; // Default slate
    }
  };

  // Get a human-readable description of the dependency
  const getDependencyDescription = () => {
    const sourceName = sourcePost.title;
    const targetName = targetPost.title;
    
    switch (dependency.dependencyType) {
      case DependencyType.FinishToStart:
        return `"${sourceName}" must finish before "${targetName}" can start`;
      case DependencyType.StartToStart:
        return `"${sourceName}" must start before "${targetName}" can start`;
      case DependencyType.FinishToFinish:
        return `"${sourceName}" must finish before "${targetName}" can finish`;
      case DependencyType.StartToFinish:
        return `"${sourceName}" must start before "${targetName}" can finish`;
      default:
        return `"${sourceName}" depends on "${targetName}"`;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <g
            className="cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <path
              d={buildPath()}
              fill="none"
              stroke={getDependencyColor()}
              strokeWidth={isHovered ? 2 : 1.5}
              strokeDasharray={dependency.dependencyType === DependencyType.StartToStart ? "5,5" : undefined}
              className={cn(
                "transition-all duration-75",
                isHovered ? "opacity-100" : "opacity-70"
              )}
            />
            
            {/* Arrow marker at the end of the path */}
            <marker
              id={`arrow-${dependency.id}`}
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                fill={getDependencyColor()}
              />
            </marker>
            
            {/* Delete button that appears on hover */}
            {isHovered && onDelete && (
              <g
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(dependency);
                }}
                className="cursor-pointer"
              >
                <circle
                  cx={(sourceRect.left + sourceRect.width / 2 + targetRect.left + targetRect.width / 2) / 2}
                  cy={(sourceRect.top + sourceRect.height / 2 + targetRect.top + targetRect.height / 2) / 2}
                  r="10"
                  fill="white"
                  stroke={getDependencyColor()}
                  strokeWidth="1"
                  className="shadow-sm"
                />
                <foreignObject
                  x={(sourceRect.left + sourceRect.width / 2 + targetRect.left + targetRect.width / 2) / 2 - 8}
                  y={(sourceRect.top + sourceRect.height / 2 + targetRect.top + targetRect.height / 2) / 2 - 8}
                  width="16"
                  height="16"
                >
                  <X className="h-4 w-4 text-destructive" />
                </foreignObject>
              </g>
            )}
          </g>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="space-y-1">
            <div className="font-medium">{getDependencyDescription()}</div>
            <div className="text-xs text-muted-foreground">
              Click to select or delete this dependency
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 