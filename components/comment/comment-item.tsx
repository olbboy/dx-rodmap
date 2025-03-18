"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Comment } from "@/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommentForm } from "./comment-form";
import { updateComment, deleteComment } from "@/lib/actions/comment";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { ReplyIcon, TrashIcon, Pencil, Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommentItemProps {
  comment: Comment;
  replies: Comment[];
  postId: string;
  onReply: (comment: Comment) => void;
  onUpdate: (comment: Partial<Comment> & { id: string }) => void;
  onDelete: (commentId: string) => void;
}

export function CommentItem({
  comment,
  replies,
  postId,
  onReply,
  onUpdate,
  onDelete
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Format the creation date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If less than 24 hours ago, show relative time
    if (now.getTime() - date.getTime() < 24 * 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    
    // Otherwise show the full date
    return format(date, "MMM d, yyyy 'at' h:mm a");
  };

  // Handle saving edited comment
  const handleSaveEdit = async () => {
    if (editedContent.trim() === "") {
      toast.error("Comment cannot be empty");
      return;
    }
    
    if (editedContent === comment.content) {
      setIsEditing(false);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { success, error } = await updateComment(comment.id, {
        content: editedContent
      });
      
      if (error) {
        toast.error(error.message);
      } else if (success) {
        onUpdate({ id: comment.id, content: editedContent, is_edited: true });
        toast.success("Comment updated successfully");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting comment
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { success, error } = await deleteComment(comment.id);
      
      if (error) {
        toast.error(error.message);
      } else if (success) {
        onDelete(comment.id);
        toast.success("Comment deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.user?.avatar_url || ""} alt={comment.user?.display_name || comment.user?.email || "User"} />
          <AvatarFallback>{getInitials(comment.user?.display_name || comment.user?.email || "")}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium">
                {comment.user?.display_name || comment.user?.email || "Anonymous"}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>{formatDate(comment.created_at)}</span>
                {comment.is_edited && (
                  <span className="flex items-center gap-0.5">
                    · <Clock className="h-3 w-3" /> Edited
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsReplying(!isReplying)} 
                disabled={isSubmitting}
                className="h-8 px-2"
              >
                <ReplyIcon className="h-4 w-4 mr-1" />
                Reply
              </Button>
              
              {/* Only show edit/delete for the comment author */}
              {/* In a real app, you'd check the current user ID against comment.user_id */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditing(!isEditing)} 
                disabled={isSubmitting}
                className="h-8 px-2"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDelete} 
                disabled={isSubmitting}
                className="h-8 px-2 text-destructive hover:text-destructive"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                disabled={isSubmitting}
                className="min-h-20"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(comment.content);
                  }}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSubmitting}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose-sm max-w-none">
              {comment.content}
            </div>
          )}
        </div>
      </div>
      
      {isReplying && (
        <div className="ml-12">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            onCommentAdded={(newComment) => {
              onReply(newComment);
              setIsReplying(false);
            }}
            autoFocus
          />
        </div>
      )}
      
      {replies.length > 0 && (
        <div className={cn("space-y-4", replies.length > 0 ? "ml-12 pt-2 border-l-2 border-muted pl-4" : "")}>
          {replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replies={[]} // Assuming no nested replies beyond level 2
              postId={postId}
              onReply={onReply}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
} 