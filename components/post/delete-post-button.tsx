"use client";

import { useState } from "react";
import { Post } from "@/types";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { 
  DropdownMenuItem,
  DropdownMenuShortcut
} from "@/components/ui/dropdown-menu";
import { deletePost } from "@/lib/actions/post";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeletePostButtonProps {
  post: Post;
  asDropdownItem?: boolean;
  onDeleted?: () => void;
}

export function DeletePostButton({ post, asDropdownItem = false, onDeleted }: DeletePostButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const { success, error } = await deletePost(post.id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      toast.success("Post deleted successfully");
      
      if (onDeleted) {
        onDeleted();
      } else {
        // Navigate to roadmap page if we're on a post page
        router.push(`/roadmaps/${post.roadmap_id}`);
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };
  
  const trigger = asDropdownItem ? (
    <DropdownMenuItem 
      onSelect={(e) => e.preventDefault()}
      disabled={isDeleting}
    >
      <Trash className="mr-2 h-4 w-4" />
      Delete
      {isDeleting && <DropdownMenuShortcut>...</DropdownMenuShortcut>}
    </DropdownMenuItem>
  ) : (
    <Button 
      variant="destructive" 
      size="sm" 
      disabled={isDeleting}
    >
      <Trash className="mr-2 h-4 w-4" />
      Delete
      {isDeleting && "..."}
    </Button>
  );
  
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the post 
            &ldquo;{post.title}&rdquo; and remove it from the roadmap.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 