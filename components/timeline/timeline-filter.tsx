"use client";

import { useState, useEffect } from "react";
import { Post, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Check, ChevronDown, Filter, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export type FilterState = {
  startDate: Date | undefined;
  endDate: Date | undefined;
  statusIds: string[];
  assigneeIds: string[];
  priorities: string[];
  tags: string[];
  searchTerm: string;
}

export type FilterFieldsConfig = {
  showDates?: boolean;
  showStatus?: boolean;
  showAssignee?: boolean;
  showPriority?: boolean;
  showTags?: boolean;
  showSearch?: boolean;
}

export interface TimelineFilterProps {
  posts: Post[];
  users?: User[];
  availableStatuses?: { id: string; name: string; color?: string }[];
  availableTags?: string[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  className?: string;
  fields?: FilterFieldsConfig;
}

export function TimelineFilter({
  posts,
  users = [],
  availableStatuses = [],
  availableTags = [],
  filters,
  onFilterChange,
  className,
  fields = {
    showDates: true,
    showStatus: true,
    showAssignee: true,
    showPriority: true,
    showTags: true,
    showSearch: true
  }
}: TimelineFilterProps) {
  // Local state for filters
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Extract available priorities from posts
  const availablePriorities = Array.from(
    new Set(posts.map(post => post.priority).filter(Boolean) as string[])
  );
  
  // Handle local filter changes
  const updateLocalFilter = (key: keyof FilterState, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };
  
  // Apply filters
  const applyFilters = () => {
    onFilterChange(localFilters);
    setIsFilterOpen(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    const emptyFilters: FilterState = {
      startDate: undefined,
      endDate: undefined,
      statusIds: [],
      assigneeIds: [],
      priorities: [],
      tags: [],
      searchTerm: ""
    };
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };
  
  // Count active filters
  const activeFilterCount = [
    localFilters.startDate,
    localFilters.endDate,
    ...(localFilters.statusIds || []),
    ...(localFilters.assigneeIds || []),
    ...(localFilters.priorities || []),
    ...(localFilters.tags || [])
  ].filter(Boolean).length + (localFilters.searchTerm ? 1 : 0);
  
  // Reset a specific filter
  const resetFilter = (key: keyof FilterState) => {
    if (key === 'startDate' || key === 'endDate') {
      updateLocalFilter(key, undefined);
    } else if (key === 'searchTerm') {
      updateLocalFilter(key, "");
    } else {
      updateLocalFilter(key, []);
    }
    
    // Also apply the change immediately
    onFilterChange({
      ...localFilters,
      [key]: key === 'startDate' || key === 'endDate' 
        ? undefined 
        : key === 'searchTerm' 
          ? "" 
          : []
    });
  };
  
  // Sync local filters with props
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);
  
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Quick search - always visible */}
        {fields.showSearch && (
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search posts..."
              className="pl-8 h-9 rounded-md border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-sm w-full"
              value={localFilters.searchTerm}
              onChange={(e) => {
                const newValue = e.target.value;
                updateLocalFilter('searchTerm', newValue);
                onFilterChange({ ...localFilters, searchTerm: newValue });
              }}
            />
            {localFilters.searchTerm && (
              <button 
                onClick={() => resetFilter('searchTerm')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      
        {/* Filter button & sheet */}
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 h-9"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Timeline Filters</SheetTitle>
              <SheetDescription>
                Filter posts by date, status, assignee, and more
              </SheetDescription>
            </SheetHeader>
            
            <div className="py-4 space-y-6">
              {/* Date Filter */}
              {fields.showDates && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Date Range</h3>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-start text-left h-9"
                          size="sm"
                        >
                          {localFilters.startDate ? (
                            format(localFilters.startDate, "PPP")
                          ) : (
                            <span className="text-muted-foreground">Pick start date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={localFilters.startDate}
                          onSelect={(date) => updateLocalFilter('startDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-muted-foreground">to</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="justify-start text-left h-9"
                          size="sm"
                        >
                          {localFilters.endDate ? (
                            format(localFilters.endDate, "PPP")
                          ) : (
                            <span className="text-muted-foreground">Pick end date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={localFilters.endDate}
                          onSelect={(date) => updateLocalFilter('endDate', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
              
              {/* Status Filter */}
              {fields.showStatus && availableStatuses.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Status</h3>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {availableStatuses.map(status => (
                      <div 
                        key={status.id} 
                        className="flex items-center space-x-2"
                      >
                        <Checkbox 
                          id={`status-${status.id}`}
                          checked={localFilters.statusIds.includes(status.id)}
                          onCheckedChange={(checked: boolean) => {
                            const newStatusIds = checked
                              ? [...localFilters.statusIds, status.id]
                              : localFilters.statusIds.filter(id => id !== status.id);
                            updateLocalFilter('statusIds', newStatusIds);
                          }}
                        />
                        <Label 
                          htmlFor={`status-${status.id}`}
                          className="text-sm cursor-pointer flex items-center"
                        >
                          {status.color && (
                            <span 
                              className="w-2 h-2 rounded-full mr-1.5"
                              style={{ backgroundColor: status.color }}
                            ></span>
                          )}
                          {status.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Assignee Filter */}
              {fields.showAssignee && users.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Assignee</h3>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {users.map(user => (
                      <div 
                        key={user.id} 
                        className="flex items-center space-x-2"
                      >
                        <Checkbox 
                          id={`user-${user.id}`}
                          checked={localFilters.assigneeIds.includes(user.id)}
                          onCheckedChange={(checked: boolean) => {
                            const newAssigneeIds = checked
                              ? [...localFilters.assigneeIds, user.id]
                              : localFilters.assigneeIds.filter(id => id !== user.id);
                            updateLocalFilter('assigneeIds', newAssigneeIds);
                          }}
                        />
                        <Label 
                          htmlFor={`user-${user.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {user.email || `User ${user.id}`}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Priority Filter */}
              {fields.showPriority && availablePriorities.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Priority</h3>
                  <div className="space-y-1">
                    {availablePriorities.map(priority => (
                      <div 
                        key={priority} 
                        className="flex items-center space-x-2"
                      >
                        <Checkbox 
                          id={`priority-${priority}`}
                          checked={localFilters.priorities.includes(priority)}
                          onCheckedChange={(checked: boolean) => {
                            const newPriorities = checked
                              ? [...localFilters.priorities, priority]
                              : localFilters.priorities.filter(p => p !== priority);
                            updateLocalFilter('priorities', newPriorities);
                          }}
                        />
                        <Label 
                          htmlFor={`priority-${priority}`}
                          className="text-sm cursor-pointer capitalize"
                        >
                          {priority}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tags Filter */}
              {fields.showTags && availableTags.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Tags</h3>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {availableTags.map(tag => (
                      <div 
                        key={tag} 
                        className="flex items-center space-x-2"
                      >
                        <Checkbox 
                          id={`tag-${tag}`}
                          checked={localFilters.tags.includes(tag)}
                          onCheckedChange={(checked: boolean) => {
                            const newTags = checked
                              ? [...localFilters.tags, tag]
                              : localFilters.tags.filter(t => t !== tag);
                            updateLocalFilter('tags', newTags);
                          }}
                        />
                        <Label 
                          htmlFor={`tag-${tag}`}
                          className="text-sm cursor-pointer"
                        >
                          {tag}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <Separator />
            
            <SheetFooter className="pt-4 sm:justify-between flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={resetFilters} type="button">
                Reset All
              </Button>
              <Button onClick={applyFilters}>Apply Filters</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Active Filter Pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {localFilters.startDate && (
            <FilterPill 
              label={`From: ${format(localFilters.startDate, "MMM d, yyyy")}`}
              onRemove={() => resetFilter('startDate')} 
            />
          )}
          
          {localFilters.endDate && (
            <FilterPill 
              label={`To: ${format(localFilters.endDate, "MMM d, yyyy")}`}
              onRemove={() => resetFilter('endDate')} 
            />
          )}
          
          {fields.showStatus && localFilters.statusIds.length > 0 && (
            <FilterPill 
              label={`Status: ${localFilters.statusIds.length}`}
              onRemove={() => resetFilter('statusIds')} 
            />
          )}
          
          {fields.showAssignee && localFilters.assigneeIds.length > 0 && (
            <FilterPill 
              label={`Assignee: ${localFilters.assigneeIds.length}`}
              onRemove={() => resetFilter('assigneeIds')} 
            />
          )}
          
          {fields.showPriority && localFilters.priorities.length > 0 && (
            <FilterPill 
              label={`Priority: ${localFilters.priorities.length}`}
              onRemove={() => resetFilter('priorities')} 
            />
          )}
          
          {fields.showTags && localFilters.tags.length > 0 && (
            <FilterPill 
              label={`Tags: ${localFilters.tags.length}`}
              onRemove={() => resetFilter('tags')} 
            />
          )}
          
          {activeFilterCount > 1 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={resetFilters}
            >
              Clear All
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1 pl-2 pr-1 h-6">
      {label}
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-4 w-4 rounded-full bg-muted" 
        onClick={onRemove}
      >
        <X className="h-2 w-2" />
      </Button>
    </Badge>
  );
} 