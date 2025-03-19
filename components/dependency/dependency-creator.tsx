"use client";

import { useState, useEffect } from "react";
import { Dependency, DependencyType, Post } from "@/types";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ArrowRight, AlertCircle } from "lucide-react";
import { createDependency } from "@/lib/actions/dependency";

// Define local alert components if ui/alert is not available
const Alert = ({ children, variant }: { children: React.ReactNode, variant?: string }) => (
  <div className={`p-4 border rounded-md ${variant === 'destructive' ? 'bg-destructive/10 border-destructive text-destructive' : 'bg-muted'}`}>
    <div className="flex gap-2">{children}</div>
  </div>
);

const AlertDescription = ({ children }: { children: React.ReactNode }) => (
  <div className="text-sm">{children}</div>
);

interface DependencyCreatorProps {
  roadmapId: string;
  sourceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  posts: Post[];
  onDependencyCreated?: (dependency: Dependency) => void;
}

export function DependencyCreator({
  roadmapId,
  sourceId,
  open,
  onOpenChange,
  posts,
  onDependencyCreated
}: DependencyCreatorProps) {
  const [targetId, setTargetId] = useState<string>("");
  const [dependencyType, setDependencyType] = useState<DependencyType>(DependencyType.FinishToStart);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTargetId("");
      setDependencyType(DependencyType.FinishToStart);
      setError(null);
    }
  }, [open]);
  
  // Get the source post
  const sourcePost = posts.find(post => post.id === sourceId);
  
  // Get filtered target posts (exclude source post and any posts with existing dependencies)
  const eligibleTargetPosts = posts.filter(post => post.id !== sourceId);
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!targetId) {
      setError("Please select a target post");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const dependency = await createDependency({
        roadmapId,
        sourceId,
        targetId,
        dependencyType
      });
      
      if (dependency) {
        onDependencyCreated?.(dependency);
        onOpenChange(false);
      } else {
        setError("Failed to create dependency");
      }
    } catch (err) {
      console.error("Error creating dependency:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Dependency</DialogTitle>
          <DialogDescription>
            Create a dependency between two posts to indicate their relationship.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">From</Label>
            <div className="col-span-3 p-2 border rounded-md bg-muted">
              {sourcePost?.title || 'Unknown post'}
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Type</Label>
            <Select value={dependencyType} onValueChange={(value) => setDependencyType(value as DependencyType)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select dependency type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DependencyType.FinishToStart}>
                  Finish to Start <span className="text-muted-foreground ml-2">(Most common)</span>
                </SelectItem>
                <SelectItem value={DependencyType.StartToStart}>Start to Start</SelectItem>
                <SelectItem value={DependencyType.FinishToFinish}>Finish to Finish</SelectItem>
                <SelectItem value={DependencyType.StartToFinish}>Start to Finish</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">To</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select target post" />
              </SelectTrigger>
              <SelectContent>
                {eligibleTargetPosts.length > 0 ? (
                  eligibleTargetPosts.map(post => (
                    <SelectItem key={post.id} value={post.id}>
                      {post.title}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No eligible target posts
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-center py-2">
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-6 w-28 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
                {sourcePost?.title?.substring(0, 15) || 'Source'}
                {sourcePost?.title && sourcePost.title.length > 15 ? '...' : ''}
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="h-6 w-28 rounded bg-primary/10 border border-primary/20 flex items-center justify-center">
                {targetId ? 
                  (posts.find(p => p.id === targetId)?.title?.substring(0, 15) || 'Target') : 
                  'Target'
                }
                {targetId && posts.find(p => p.id === targetId)?.title && 
                 (posts.find(p => p.id === targetId)?.title?.length || 0) > 15 ? '...' : ''}
              </div>
            </div>
            <span className="text-xs">
              {dependencyType === DependencyType.FinishToStart && "Source must finish before target can start"}
              {dependencyType === DependencyType.StartToStart && "Source must start before target can start"}
              {dependencyType === DependencyType.FinishToFinish && "Source must finish before target can finish"}
              {dependencyType === DependencyType.StartToFinish && "Source must start before target can finish"}
            </span>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !targetId || eligibleTargetPosts.length === 0}
          >
            {isLoading ? "Creating..." : "Create Dependency"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 