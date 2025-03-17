"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Edit2, Calendar, Tag, User, MoreHorizontal, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Feature, Status, Tag as TagType } from "@/types";
import { cn } from "@/lib/utils";

interface FeatureListProps {
  features: Feature[];
  roadmapId: string;
  statuses: Status[];
  tags: TagType[];
  isOwner: boolean;
}

export function FeatureList({ features, roadmapId, statuses, tags, isOwner }: FeatureListProps) {
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const filteredFeatures = features.filter(feature => {
    // Text filter
    const textMatch = !filterText || 
      feature.title.toLowerCase().includes(filterText.toLowerCase()) ||
      (feature.description && feature.description.toLowerCase().includes(filterText.toLowerCase()));
    
    // Status filter
    const statusMatch = !statusFilter || feature.status_id === statusFilter;
    
    // Tag filter
    const tagMatch = !tagFilter || (feature.tags && feature.tags.some(tag => tag.id === tagFilter));
    
    return textMatch && statusMatch && tagMatch;
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
  };

  const handleStatusFilterChange = (statusId: string | null) => {
    setStatusFilter(statusId === statusFilter ? null : statusId);
  };

  const handleTagFilterChange = (tagId: string | null) => {
    setTagFilter(tagId === tagFilter ? null : tagId);
  };

  const clearFilters = () => {
    setFilterText("");
    setStatusFilter(null);
    setTagFilter(null);
  };

  const getStatusColor = (statusId: string | null) => {
    if (!statusId) return "#e2e8f0"; // Default color
    const status = statuses.find(s => s.id === statusId);
    return status ? status.color : "#e2e8f0";
  };

  const getStatusName = (statusId: string | null) => {
    if (!statusId) return "No Status";
    const status = statuses.find(s => s.id === statusId);
    return status ? status.name : "Unknown";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative">
          <Input
            placeholder="Search features..."
            value={filterText}
            onChange={handleFilterChange}
            className="max-w-sm pl-10"
          />
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {statuses.map(status => (
            <Badge
              key={status.id}
              variant={statusFilter === status.id ? "default" : "outline"}
              onClick={() => handleStatusFilterChange(status.id)}
              className="cursor-pointer"
              style={{
                backgroundColor: statusFilter === status.id ? status.color : "transparent",
                color: statusFilter === status.id ? "#fff" : "inherit",
                borderColor: status.color,
              }}
            >
              {status.name}
            </Badge>
          ))}
          
          {tags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Tag className="mr-2 h-4 w-4" />
                  Tags
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {tags.map(tag => (
                  <DropdownMenuItem
                    key={tag.id}
                    onClick={() => handleTagFilterChange(tag.id)}
                    className={cn(
                      "flex items-center",
                      tagFilter === tag.id && "bg-accent"
                    )}
                  >
                    <div
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </DropdownMenuItem>
                ))}
                {tagFilter && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setTagFilter(null)}>
                      Clear tag filter
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {(statusFilter || tagFilter || filterText) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          )}
        </div>
      </div>
      
      {filteredFeatures.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFeatures.map(feature => (
            <Card key={feature.id} className="flex flex-col h-full">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: getStatusColor(feature.status_id) }}
                    />
                    <Link
                      href={`/roadmaps/${roadmapId}/features/${feature.id}`}
                      className="hover:underline"
                    >
                      {feature.title}
                    </Link>
                  </CardTitle>
                </div>
                {isOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/roadmaps/${roadmapId}/features/${feature.id}`}>
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/roadmaps/${roadmapId}/features/${feature.id}/edit`}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        // onClick={() => handleDelete(feature.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardHeader>
              <CardContent className="flex flex-col flex-1">
                {feature.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {feature.description}
                  </p>
                )}
                
                <div className="mt-auto space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Badge 
                      variant="outline"
                      className="mr-2"
                      style={{
                        borderColor: getStatusColor(feature.status_id),
                        color: 'inherit'
                      }}
                    >
                      {getStatusName(feature.status_id)}
                    </Badge>
                  </div>
                  
                  {feature.tags && feature.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {feature.tags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-xs"
                          style={{ 
                            backgroundColor: tag.color, 
                            color: "#fff",
                            borderColor: tag.color,
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    {feature.assignee ? (
                      <div className="flex items-center">
                        <User className="mr-1 h-3 w-3" />
                        {feature.assignee.display_name || feature.assignee.email}
                      </div>
                    ) : (
                      <span>Unassigned</span>
                    )}
                    
                    {feature.due_date && (
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        {format(new Date(feature.due_date), "MMM d")}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">No features found</h3>
          <p className="text-muted-foreground mb-6">
            {filterText || statusFilter || tagFilter
              ? "Try adjusting your filters to see more results."
              : "Create your first feature to start building your roadmap."}
          </p>
          {isOwner && !filterText && !statusFilter && !tagFilter && (
            <Button asChild>
              <Link href={`/roadmaps/${roadmapId}/features/new`}>
                Add Feature
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 