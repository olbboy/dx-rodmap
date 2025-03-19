"use client";

import { useState } from "react";
import { Dependency } from "@/types";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteDependency } from "@/lib/actions/dependency";

interface DeleteDependencyButtonProps {
  dependency: Dependency;
  onDeleted?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  asIcon?: boolean;
}

export function DeleteDependencyButton({
  dependency,
  onDeleted,
  variant = "outline",
  size = "sm",
  className = "",
  asIcon = false
}: DeleteDependencyButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDelete = async () => {
    setIsLoading(true);
    
    try {
      await deleteDependency(dependency.id);
      onDeleted?.();
    } catch (error) {
      console.error("Failed to delete dependency:", error);
    } finally {
      setIsLoading(false);
      setOpen(false);
    }
  };
  
  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
        disabled={isLoading}
      >
        {asIcon ? (
          <Trash2 className="h-4 w-4" />
        ) : (
          <>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Dependency
          </>
        )}
      </Button>
      
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the dependency between your posts.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 