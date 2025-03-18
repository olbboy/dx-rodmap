"use client";

import { useRef, useState } from "react";
import { Post } from "@/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { differenceInDays, format, addDays } from "date-fns";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TimelineItemProps {
  post: Post;
  startDate: Date; // Timeline start date
  endDate: Date; // Timeline end date
  cellWidth: number;
  rowHeight: number;
  left: number;
  top: number;
  width: number;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
  onCreateDependency?: (sourcePostId: string) => void;
}

export function TimelineItem({
  post,
  startDate,
  endDate,
  cellWidth,
  rowHeight,
  left,
  top,
  width,
  onEdit,
  onDelete,
  onCreateDependency,
}: TimelineItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const startRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Calculate dates and duration
  const postStartDate = post.start_date ? new Date(post.start_date) : new Date();
  const postEndDate = post.end_date ? new Date(post.end_date) : addDays(postStartDate, 7);
  const duration = differenceInDays(postEndDate, postStartDate) + 1;
  
  // Determine color based on post priority or status
  const getItemColor = () => {
    if (post.priority) {
      switch (post.priority) {
        case "urgent":
          return "bg-red-500";
        case "high":
          return "bg-orange-500";
        case "medium":
          return "bg-yellow-500";
        case "low":
          return "bg-green-500";
        default:
          return "bg-blue-500";
      }
    }
    
    // Default or use status color if available
    return post.status?.color ? `bg-[${post.status.color}]` : "bg-blue-500";
  };

  const handleMouseDown = (e: React.MouseEvent, type: "move" | "right" | "left") => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === "move") setIsDragging(true);
    if (type === "right") setIsDraggingRight(true);
    if (type === "left") setIsDraggingLeft(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      // Implement drag logic
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsDraggingRight(false);
      setIsDraggingLeft(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "absolute cursor-grab select-none",
        isDragging && "cursor-grabbing opacity-75 z-10"
      )}
      style={{
        left,
        top,
        width,
        height: rowHeight - 8,
      }}
      onMouseDown={(e) => handleMouseDown(e, "move")}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className={cn("w-full h-full overflow-hidden border-l-4", getItemColor())}>
              <CardContent className="p-2 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="truncate text-sm font-medium pr-2">
                    {post.title}
                  </div>
                  <div className="flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-5 w-5 flex items-center justify-center rounded-sm hover:bg-muted">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onEdit?.(post)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onCreateDependency?.(post.id)}>
                          Create Dependency
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete?.(post)}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="mt-1">
                  {post.progress !== null && (
                    <Progress 
                      value={post.progress} 
                      className="h-1"
                    />
                  )}
                </div>
                
                {rowHeight > 40 && (
                  <div className="mt-2 text-xs flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{format(postStartDate, 'MMM d')}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{duration}d</span>
                    </div>
                  </div>
                )}
                
                {rowHeight > 60 && post.assignee && (
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {post.status?.name || "No Status"}
                    </Badge>
                    <Avatar className="h-5 w-5">
                      <AvatarImage 
                        src={post.assignee.avatar_url || ""} 
                        alt={post.assignee.display_name || post.assignee.full_name || ""} 
                      />
                      <AvatarFallback className="text-[8px]">
                        {(post.assignee.display_name || post.assignee.full_name || "")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-md">
            <div className="space-y-2">
              <div className="font-semibold">{post.title}</div>
              {post.description && (
                <div className="text-xs text-muted-foreground">{post.description}</div>
              )}
              <div className="text-xs grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  <span className="font-medium mr-1">Start:</span>
                  {post.start_date ? format(new Date(post.start_date), 'PPP') : 'Not set'}
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-1">End:</span>
                  {post.end_date ? format(new Date(post.end_date), 'PPP') : 'Not set'}
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-1">Status:</span>
                  {post.status?.name || 'Not set'}
                </div>
                <div className="flex items-center">
                  <span className="font-medium mr-1">Priority:</span>
                  {post.priority ? post.priority.charAt(0).toUpperCase() + post.priority.slice(1) : 'Not set'}
                </div>
                {post.assignee && (
                  <div className="flex items-center col-span-2">
                    <span className="font-medium mr-1">Assignee:</span>
                    {post.assignee.display_name || post.assignee.full_name || post.assignee.email}
                  </div>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Resize handles */}
      <div
        ref={startRef}
        className={cn(
          "absolute top-0 left-0 w-2 h-full cursor-col-resize",
          isDraggingLeft && "z-10"
        )}
        onMouseDown={(e) => handleMouseDown(e, "left")}
      />
      <div
        ref={endRef}
        className={cn(
          "absolute top-0 right-0 w-2 h-full cursor-col-resize",
          isDraggingRight && "z-10"
        )}
        onMouseDown={(e) => handleMouseDown(e, "right")}
      />
    </div>
  );
} 