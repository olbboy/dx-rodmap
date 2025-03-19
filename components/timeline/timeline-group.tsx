"use client";

import { useState, useMemo } from "react";
import { Post } from "@/types";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, ChevronUp, LayersIcon, UsersIcon, AlertTriangleIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export type GroupBy = "status" | "assignee" | "priority" | "none";

export type GroupedPosts = {
  [key: string]: {
    posts: Post[];
    label: string;
    color?: string;
  };
}

export interface TimelineGroupProps {
  posts: Post[];
  groupBy: GroupBy;
  statuses?: { id: string; name: string; color?: string }[];
  users?: { id: string; email: string }[];
  onGroupChange?: (groupBy: GroupBy) => void;
  className?: string;
  children: (posts: Post[]) => React.ReactNode;
}

export function TimelineGroup({
  posts,
  groupBy,
  statuses = [],
  users = [],
  onGroupChange,
  className,
  children
}: TimelineGroupProps) {
  // State to track collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  
  // Compute grouped posts based on groupBy criteria
  const groupedPosts = useMemo(() => {
    if (groupBy === "none") {
      return { "all": { posts, label: "All Items", color: undefined } };
    }
    
    const groups: GroupedPosts = {};
    
    posts.forEach(post => {
      let key = "";
      let label = "";
      let color = undefined;
      
      if (groupBy === "status") {
        key = post.status_id || "none";
        const status = statuses.find(s => s.id === key);
        label = status ? status.name : "No Status";
        color = status?.color;
      } 
      else if (groupBy === "assignee") {
        key = post.assignee_id || "none";
        const user = users.find(u => u.id === key);
        label = user ? user.email : "Unassigned";
      }
      else if (groupBy === "priority") {
        key = post.priority || "none";
        label = key !== "none" ? key.charAt(0).toUpperCase() + key.slice(1) : "No Priority";
        
        // Set color based on priority
        if (key === "high") color = "#ef4444";
        else if (key === "medium") color = "#f97316";
        else if (key === "low") color = "#3b82f6";
      }
      
      // Create group if it doesn't exist
      if (!groups[key]) {
        groups[key] = {
          posts: [],
          label,
          color
        };
      }
      
      // Add post to group
      groups[key].posts.push(post);
    });
    
    // Sort groups by priority if grouping by priority
    if (groupBy === "priority") {
      const priorityOrder = { high: 1, medium: 2, low: 3, none: 4 };
      const sorted: GroupedPosts = {};
      
      Object.keys(groups)
        .sort((a, b) => {
          const orderA = priorityOrder[a as keyof typeof priorityOrder] || 999;
          const orderB = priorityOrder[b as keyof typeof priorityOrder] || 999;
          return orderA - orderB;
        })
        .forEach(key => {
          sorted[key] = groups[key];
        });
      
      return sorted;
    }
    
    return groups;
  }, [posts, groupBy, statuses, users]);
  
  // Toggle collapse state for a specific group
  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };
  
  // Collapse all groups
  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    Object.keys(groupedPosts).forEach(key => {
      allCollapsed[key] = true;
    });
    setCollapsedGroups(allCollapsed);
  };
  
  // Expand all groups
  const expandAll = () => {
    setCollapsedGroups({});
  };
  
  // Early return if no posts
  if (posts.length === 0) {
    return null;
  }
  
  // Count the total number of groups
  const groupCount = Object.keys(groupedPosts).length;
  
  // Show collapse/expand buttons only if we have multiple groups
  const showCollapseButtons = groupCount > 1;
  
  return (
    <div className={className}>
      {/* Group control buttons */}
      {showCollapseButtons && (
        <div className="flex items-center justify-end gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={collapseAll}
          >
            <ChevronUp className="h-3 w-3 mr-1" />
            Collapse All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={expandAll}
          >
            <ChevronDown className="h-3 w-3 mr-1" />
            Expand All
          </Button>
        </div>
      )}
      
      {/* Render groups */}
      <div className="space-y-4">
        {Object.entries(groupedPosts).map(([key, { posts: groupPosts, label, color }]) => {
          const isCollapsed = !!collapsedGroups[key];
          const hasItems = groupPosts.length > 0;
          
          return (
            <div key={key} className="border rounded-md">
              <GroupHeader
                label={label}
                color={color}
                count={groupPosts.length}
                isCollapsed={isCollapsed}
                onToggle={() => toggleGroup(key)}
                groupBy={groupBy}
              />
              
              {!isCollapsed && (
                <div className="p-0">
                  {children(groupPosts)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface GroupHeaderProps {
  label: string;
  color?: string;
  count: number;
  isCollapsed: boolean;
  onToggle: () => void;
  groupBy: GroupBy;
}

function GroupHeader({ label, color, count, isCollapsed, onToggle, groupBy }: GroupHeaderProps) {
  // Select icon based on group type
  const GroupIcon = useMemo(() => {
    if (groupBy === "status") return LayersIcon;
    if (groupBy === "assignee") return UsersIcon;
    if (groupBy === "priority") return AlertTriangleIcon;
    return LayersIcon;
  }, [groupBy]);

  return (
    <button
      className="w-full flex items-center justify-between bg-muted/40 px-3 py-2 hover:bg-muted text-left"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
        
        <div className="flex items-center gap-1.5">
          {color ? (
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
          ) : (
            <GroupIcon className="h-4 w-4 text-muted-foreground" />
          )}
          
          <span className="font-medium text-sm">{label}</span>
        </div>
      </div>
      
      <Badge variant="secondary" className="ml-2">
        {count}
      </Badge>
    </button>
  );
} 