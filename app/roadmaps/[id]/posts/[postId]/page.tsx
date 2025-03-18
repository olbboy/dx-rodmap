import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DeletePostButton } from "@/components/post/delete-post-button"; 
import { getPostById } from "@/lib/actions/post";
import { getRoadmapById } from "@/lib/actions/roadmap";
import { getUserById } from "@/lib/actions/user";
import { getStatusById } from "@/lib/actions/status";
import { Calendar, CalendarCheck, ChevronLeft, Pencil, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { CommentList } from "@/components/comment/comment-list";

export async function generateMetadata({ params }: { params: { postId: string } }) {
  const params_awaited = await params;
  const post = await getPostById(params_awaited.postId);
  
  return {
    title: post ? `${post.title}` : "Post Details",
    description: post ? `View details for ${post.title}` : "View post details",
  };
}

export default async function PostDetailsPage(props: {
  params: { id: string; postId: string };
}) {
  const session = await auth();
  
  if (!session?.id) {
    redirect("/login");
  }

  // Await the params
  const params = await props.params;
  const { id, postId } = params;
  
  // Get roadmap
  const roadmapResult = await getRoadmapById(id);
  const roadmap = roadmapResult.data;
  
  if (!roadmap) {
    redirect("/dashboard");
  }
  
  // Get post
  const post = await getPostById(postId);
  
  if (!post) {
    notFound();
  }
  
  // Ensure post belongs to this roadmap
  if (post.roadmap_id !== id) {
    redirect(`/roadmaps/${id}`);
  }
  
  // Check if user is owner
  const isOwner = roadmap.owner_id === session.id;
  
  // Format dates if available
  const startDate = post.start_date ? format(new Date(post.start_date), "PPP") : null;
  const endDate = post.end_date ? format(new Date(post.end_date), "PPP") : null;
  const etaDate = post.eta ? format(new Date(post.eta), "PPP") : null;
  
  // Get progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };
  
  // Priority badge styling
  const priorityBadgeVariant = post.priority ? {
    urgent: "destructive",
    high: "destructive",
    medium: "secondary",
    low: "outline",
  }[post.priority] as "destructive" | "secondary" | "outline" : "outline";

  const priorityLabel = post.priority ? {
    urgent: "Urgent",
    high: "High Priority",
    medium: "Medium Priority",
    low: "Low Priority",
  }[post.priority] : null;
  
  return (
    <div className="container py-6">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/roadmaps/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Roadmap
          </Link>
        </Button>
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{post.title}</h1>
          
          {isOwner && (
            <div className="flex items-center gap-2">
              <Button asChild>
                <Link href={`/roadmaps/${id}/posts/${postId}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </Button>
              <DeletePostButton post={post} />
            </div>
          )}
        </div>
        
        {post.status && (
          <div className="flex items-center gap-2 mt-2">
            <div 
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: post.status.color || "#888" }}
            />
            <span className="text-sm text-muted-foreground">
              {post.status.name}
            </span>
          </div>
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-8">
          {/* Description */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Description</h2>
            {post.description ? (
              <div className="prose max-w-none">
                <p>{post.description}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No description provided.</p>
            )}
          </div>
          
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Progress bar if progress is set */}
          {post.progress !== null && post.progress !== undefined && post.progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <h2 className="font-semibold">Progress</h2>
                <span>{post.progress}%</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${post.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="pt-8">
            <Separator className="my-6" />
            <CommentList postId={postId} />
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Info card */}
          <div className="bg-card rounded-lg border p-4 space-y-4">
            <h2 className="font-semibold">Details</h2>
            
            {/* Assignee */}
            <div>
              <h3 className="text-sm text-muted-foreground mb-2">Assignee</h3>
              {post.assignee ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={post.assignee.avatar_url || ""} alt={post.assignee.display_name || ""} />
                    <AvatarFallback className="text-xs">
                      {post.assignee.display_name?.charAt(0) || post.assignee.email?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{post.assignee.display_name || post.assignee.email}</span>
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Unassigned</span>
              )}
            </div>
            
            {/* Priority */}
            {post.priority && (
              <div>
                <h3 className="text-sm text-muted-foreground mb-2">Priority</h3>
                <Badge 
                  variant={
                    post.priority === "high" || post.priority === "urgent" 
                      ? "destructive" 
                      : post.priority === "medium" 
                        ? "default" 
                        : "secondary"
                  }
                >
                  {post.priority}
                </Badge>
              </div>
            )}
            
            {/* Dates */}
            <div className="space-y-3">
              <h3 className="text-sm text-muted-foreground">Timeline</h3>
              
              {startDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Start: {startDate}</span>
                </div>
              )}
              
              {endDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>End: {endDate}</span>
                </div>
              )}
              
              {etaDate && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                  <span>ETA: {etaDate}</span>
                </div>
              )}
              
              {!startDate && !endDate && !etaDate && (
                <span className="text-muted-foreground text-sm">No dates set</span>
              )}
            </div>
            
            {/* Created/Updated info */}
            <div className="pt-4 border-t text-xs text-muted-foreground">
              {post.created_at && (
                <p>Created {format(new Date(post.created_at), "PPP")}</p>
              )}
              {post.updated_at && post.updated_at !== post.created_at && (
                <p>Updated {format(new Date(post.updated_at), "PPP")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 