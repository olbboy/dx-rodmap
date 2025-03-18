"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post/post-card";
import { updatePostStatus } from "@/lib/actions/post";
import { Post, Status, User } from "@/types";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface KanbanBoardProps {
  posts: Post[];
  statuses: Status[];
  users: User[];
  roadmapId: string;
  isOwner: boolean;
}

export function KanbanBoard({ posts, statuses, users, roadmapId, isOwner }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Record<string, Post[]>>({});
  const [loading, setLoading] = useState(false);

  // Create lookup maps for statuses and users
  const statusMap = statuses.reduce((acc, status) => {
    acc[status.id] = status;
    return acc;
  }, {} as Record<string, Status>);

  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, User>);

  // Initialize columns on component mount
  useEffect(() => {
    const initialColumns: Record<string, Post[]> = {};
    
    // Initialize columns for each status
    statuses.forEach(status => {
      initialColumns[status.id] = [];
    });
    
    // Populate columns with posts
    posts.forEach(post => {
      if (post.status_id && initialColumns[post.status_id]) {
        initialColumns[post.status_id].push(post);
      } else if (statuses.length > 0) {
        // If post has no status or invalid status, add to first status column
        initialColumns[statuses[0].id].push({
          ...post,
          status_id: statuses[0].id,
        });
      }
    });
    
    setColumns(initialColumns);
  }, [posts, statuses]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    // Dropped outside a column
    if (!destination) {
      return;
    }
    
    // Dropped in same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    
    // Find the post that was dragged
    const draggedPost = posts.find(post => post.id === draggableId);
    
    if (!draggedPost) {
      return;
    }
    
    // Create a copy of the source column
    const sourceColumn = [...columns[source.droppableId]];
    
    // Remove the post from the source column
    sourceColumn.splice(source.index, 1);
    
    // If moving to a different column
    if (source.droppableId !== destination.droppableId) {
      // Create a copy of the destination column
      const destinationColumn = [...columns[destination.droppableId]];
      
      // Copy the post with updated status
      const updatedPost = {
        ...draggedPost,
        status_id: destination.droppableId,
      };
      
      // Add the post to the destination column
      destinationColumn.splice(destination.index, 0, updatedPost);
      
      // Update the state
      setColumns({
        ...columns,
        [source.droppableId]: sourceColumn,
        [destination.droppableId]: destinationColumn,
      });
      
      // Update the post status in the database
      try {
        setLoading(true);
        const { success, error } = await updatePostStatus(draggableId, destination.droppableId);
        
        if (error) {
          throw new Error(error.message);
        }
        
        toast.success("Post status updated");
      } catch (error: any) {
        // If there's an error, revert the UI change
        toast.error(error.message || "Failed to update post status");
        
        // Reset the columns to their original state
        const resetColumns = { ...columns };
        const resetSourceColumn = [...resetColumns[source.droppableId]];
        const resetDestColumn = [...resetColumns[destination.droppableId]];
        
        // Add post back to original position
        resetSourceColumn.splice(source.index, 0, draggedPost);
        
        // Remove from destination
        const destIndex = resetDestColumn.findIndex(post => post.id === draggableId);
        if (destIndex !== -1) {
          resetDestColumn.splice(destIndex, 1);
        }
        
        resetColumns[source.droppableId] = resetSourceColumn;
        resetColumns[destination.droppableId] = resetDestColumn;
        
        setColumns(resetColumns);
      } finally {
        setLoading(false);
      }
    } else {
      // Reordering within the same column
      sourceColumn.splice(destination.index, 0, draggedPost);
      
      // Update the state
      setColumns({
        ...columns,
        [source.droppableId]: sourceColumn,
      });
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-full inline-flex gap-4 pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          {statuses.map(status => (
            <div key={status.id} className="w-80 flex-shrink-0">
              <div 
                className="bg-card rounded-lg border shadow-sm"
                style={{ 
                  borderTopWidth: "3px",
                  borderTopColor: status.color || "#888" 
                }}
              >
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: status.color || "#888" }}
                      />
                      {status.name}
                      <span className="text-muted-foreground ml-1">
                        ({columns[status.id]?.length || 0})
                      </span>
                    </h3>
                    {isOwner && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        asChild
                        className="h-8 w-8 p-0"
                      >
                        <Link href={`/roadmaps/${roadmapId}/posts/new?status=${status.id}`}>
                          <Plus className="h-4 w-4" />
                          <span className="sr-only">Add post</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
                
                <Droppable droppableId={status.id}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-2 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? "bg-muted/50" : ""
                      }`}
                    >
                      {columns[status.id]?.map((post, index) => (
                        <Draggable 
                          key={post.id} 
                          draggableId={post.id} 
                          index={index}
                          isDragDisabled={loading || !isOwner}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-2 rounded-md transition-transform ${
                                snapshot.isDragging ? "rotate-1 scale-105" : ""
                              }`}
                            >
                              <Link href={`/roadmaps/${roadmapId}/posts/${post.id}`}>
                                <PostCard
                                  post={post}
                                  status={statusMap[post.status_id || '']}
                                  assignee={post.assignee_id ? userMap[post.assignee_id] : undefined}
                                  roadmapId={roadmapId}
                                />
                              </Link>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {columns[status.id]?.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          {isOwner ? "Drag posts here or add a new one" : "No posts in this status"}
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          ))}
        </DragDropContext>
      </div>
    </div>
  );
} 