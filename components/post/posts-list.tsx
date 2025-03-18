"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PostCard } from "@/components/post/post-card";
import { Post, Status, User } from "@/types";
import { Plus, Filter, SortDesc, SortAsc, Search } from "lucide-react";

interface PostsListProps {
  posts: Post[];
  statuses: Status[];
  users: User[];
  roadmapId: string;
}

export function PostsList({ posts, statuses, users, roadmapId }: PostsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Create lookup maps for statuses and users
  const statusMap = statuses.reduce((acc, status) => {
    acc[status.id] = status;
    return acc;
  }, {} as Record<string, Status>);

  const userMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, User>);

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.description && post.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesStatus = !statusFilter || post.status_id === statusFilter;
    const matchesAssignee = !assigneeFilter || post.assignee_id === assigneeFilter;
    
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  // Sort posts
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    let aValue: any = a[sortField as keyof Post];
    let bValue: any = b[sortField as keyof Post];

    // Handle special cases for sorting
    if (sortField === "assignee") {
      aValue = a.assignee_id ? userMap[a.assignee_id]?.display_name || userMap[a.assignee_id]?.email || "" : "";
      bValue = b.assignee_id ? userMap[b.assignee_id]?.display_name || userMap[b.assignee_id]?.email || "" : "";
    }

    if (sortField === "status") {
      aValue = a.status_id ? statusMap[a.status_id]?.name || "" : "";
      bValue = b.status_id ? statusMap[b.status_id]?.name || "" : "";
    }

    // For null/undefined values
    if (!aValue && bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue && !bValue) return sortDirection === "asc" ? 1 : -1;
    if (!aValue && !bValue) return 0;

    // For dates and strings
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }

    // For numbers and other comparable types
    return sortDirection === "asc" 
      ? (aValue < bValue ? -1 : aValue > bValue ? 1 : 0)
      : (bValue < aValue ? -1 : bValue > aValue ? 1 : 0);
  });

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setAssigneeFilter("");
    setSortField("created_at");
    setSortDirection("desc");
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Posts</h2>
          <Button asChild>
            <Link href={`/roadmaps/${roadmapId}/posts/new`}>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Link>
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status.id} value={status.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ backgroundColor: status.color || '#888' }}
                    />
                    {status.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
            <SelectTrigger>
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by assignee" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.display_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-4 justify-between">
          <div className="flex items-center gap-2">
            <Select value={sortField} onValueChange={setSortField}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center">
                  <SortDesc className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="created_at">Date created</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="assignee">Assignee</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                {/* Add other fields as needed */}
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleSortDirection}
              title={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
            >
              {sortDirection === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {(searchQuery || statusFilter || assigneeFilter || sortField !== "created_at" || sortDirection !== "desc") && (
            <Button variant="ghost" onClick={clearFilters} size="sm">
              Clear filters
            </Button>
          )}
        </div>
      </div>
      
      {sortedPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No posts found.</p>
          {filteredPosts.length !== posts.length && (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedPosts.map((post) => (
            <Link 
              href={`/roadmaps/${roadmapId}/posts/${post.id}`} 
              key={post.id}
              className="group"
            >
              <PostCard
                post={post}
                status={post.status_id ? statusMap[post.status_id] : undefined}
                assignee={post.assignee_id ? userMap[post.assignee_id] : undefined}
                roadmapId={roadmapId}
                className="h-full transition-shadow hover:shadow-md"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 