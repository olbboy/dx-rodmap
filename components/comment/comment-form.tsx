"use client";

import { useState, useRef, useEffect } from "react";
import { createComment } from "@/lib/actions/comment";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Comment } from "@/types";

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onCommentAdded: (comment: Comment) => void;
  autoFocus?: boolean;
}

export function CommentForm({ 
  postId, 
  parentId, 
  onCommentAdded,
  autoFocus = false
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (content.trim() === "") {
      toast.error("Comment cannot be empty");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await createComment(postId, {
        content: content.trim(),
        parent_id: parentId
      });
      
      if (error) {
        toast.error(error.message);
      } else if (data) {
        onCommentAdded(data);
        setContent("");
        toast.success(parentId ? "Reply added successfully" : "Comment added successfully");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        ref={textareaRef}
        placeholder={parentId ? "Write a reply..." : "Add a comment..."}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isSubmitting}
        rows={4}
        className="resize-none"
      />
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting || content.trim() === ""}
        >
          {isSubmitting ? "Submitting..." : parentId ? "Reply" : "Comment"}
        </Button>
      </div>
    </form>
  );
} 