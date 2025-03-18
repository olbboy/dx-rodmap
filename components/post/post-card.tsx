"use client";

import { Post, Status, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: Post;
  status?: Status;
  assignee?: User;
  roadmapId: string;
  className?: string;
}

export function PostCard({ post, status, assignee, roadmapId, className = "" }: PostCardProps) {
  // Determine the creation or update time for display
  const timestamp = post.updated_at || post.created_at;
  const timeAgo = timestamp 
    ? formatDistanceToNow(new Date(timestamp), { addSuffix: true }) 
    : "";

  return (
    <Card className={`shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-medium">{post.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {/* Progress indicator, if progress is set */}
        {post.progress !== null && post.progress !== undefined && post.progress > 0 && (
          <div className="w-full bg-secondary h-1.5 rounded-full mb-3">
            <div 
              className="bg-primary h-1.5 rounded-full" 
              style={{ width: `${post.progress}%` }}
            />
          </div>
        )}
        
        {/* Description preview if available */}
        {post.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {post.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex flex-wrap gap-1">
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.tags.slice(0, 3).map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {post.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{post.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {/* Assignee */}
          {assignee && (
            <Avatar className="h-6 w-6">
              <AvatarImage src={assignee.avatar_url || ""} alt={assignee.display_name || ""} />
              <AvatarFallback className="text-xs">
                {assignee.display_name?.charAt(0) || assignee.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{timeAgo}</span>
          
          {/* Priority badge if set */}
          {post.priority && (
            <Badge 
              variant={
                post.priority === "high" || post.priority === "urgent" 
                  ? "destructive" 
                  : post.priority === "medium" 
                    ? "default" 
                    : "secondary"
              }
              className="text-xs"
            >
              {post.priority}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 