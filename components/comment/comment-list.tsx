"use client";

import { useState, useEffect } from "react";
import { Comment as CommentType } from "@/types";
import { CommentItem } from "./comment-item";
import { CommentForm } from "./comment-form";
import { getCommentsByPostId } from "@/lib/actions/comment";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface CommentListProps {
  postId: string;
}

export function CommentList({ postId }: CommentListProps) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadComments() {
      setIsLoading(true);
      try {
        const { data, error } = await getCommentsByPostId(postId);
        if (error) {
          toast.error("Failed to load comments");
          console.error(error);
        } else if (data) {
          setComments(data);
        }
      } catch (error) {
        console.error("Error loading comments:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadComments();
  }, [postId]);

  // Filter top-level comments (no parent)
  const topLevelComments = comments.filter(comment => !comment.parent_id);
  
  // Find replies for a comment
  const getReplies = (commentId: string) => {
    return comments.filter(comment => comment.parent_id === commentId);
  };

  // Add a new comment to the list
  const addComment = (comment: CommentType) => {
    setComments(prev => [...prev, comment]);
  };
  
  // Update a comment in the list
  const updateCommentInList = (updatedComment: Partial<CommentType> & { id: string }) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === updatedComment.id 
          ? { ...comment, ...updatedComment } 
          : comment
      )
    );
  };
  
  // Remove a comment from the list
  const removeComment = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Comments</h3>
        <span className="text-muted-foreground">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
      </div>
      
      <Separator />

      <CommentForm 
        postId={postId}
        onCommentAdded={addComment}
      />

      {isLoading ? (
        <div className="py-4 text-center text-muted-foreground">
          Loading comments...
        </div>
      ) : topLevelComments.length === 0 ? (
        <div className="py-4 text-center text-muted-foreground">
          No comments yet. Be the first to comment!
        </div>
      ) : (
        <div className="space-y-6">
          {topLevelComments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              onReply={addComment}
              onUpdate={updateCommentInList}
              onDelete={removeComment}
              postId={postId}
            />
          ))}
        </div>
      )}
    </div>
  );
} 