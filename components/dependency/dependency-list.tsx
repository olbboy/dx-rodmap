"use client";

import { Dependency, DependencyType, Post } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteDependencyButton } from "./delete-dependency-button";
import { ArrowRight } from "lucide-react";

interface DependencyListProps {
  dependencies: Dependency[];
  posts: Post[];
  onDependencyDeleted?: (dependencyId: string) => void;
  isOwner?: boolean;
}

// Helper function to get human-readable dependency type
function getDependencyTypeLabel(type: DependencyType): string {
  switch (type) {
    case DependencyType.FinishToStart:
      return "Finish to Start";
    case DependencyType.StartToStart:
      return "Start to Start";
    case DependencyType.FinishToFinish:
      return "Finish to Finish";
    case DependencyType.StartToFinish:
      return "Start to Finish";
    default:
      return "Unknown";
  }
}

export function DependencyList({
  dependencies,
  posts,
  onDependencyDeleted,
  isOwner = false
}: DependencyListProps) {
  // Helper function to get post title by id
  const getPostTitle = (postId: string): string => {
    const post = posts.find(p => p.id === postId);
    return post?.title || "Unknown Post";
  };
  
  if (dependencies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dependencies</CardTitle>
          <CardDescription>No dependencies found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Create dependencies between posts to show their relationships.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dependencies</CardTitle>
        <CardDescription>
          {dependencies.length} {dependencies.length === 1 ? "dependency" : "dependencies"} found
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {dependencies.map(dependency => (
            <div 
              key={dependency.id} 
              className="flex items-center justify-between p-3 rounded-md border bg-card"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getPostTitle(dependency.sourceId)}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{getPostTitle(dependency.targetId)}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Type: {getDependencyTypeLabel(dependency.dependencyType)}
                </span>
              </div>
              
              {isOwner && (
                <DeleteDependencyButton
                  dependency={dependency}
                  onDeleted={() => onDependencyDeleted?.(dependency.id)}
                  asIcon
                  variant="ghost"
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 