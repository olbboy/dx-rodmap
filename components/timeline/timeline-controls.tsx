"use client";

import { useState } from "react";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Calendar as CalendarIcon,
  SlidersHorizontal,
  Users,
  Layers,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { GroupBy } from "./timeline-group";

export type TimeScale = "day" | "week" | "month" | "quarter" | "year";

interface TimelineControlsProps {
  scale: TimeScale;
  onScaleChange: (scale: TimeScale) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (start: Date, end: Date) => void;
  
  // Visibility toggles
  showPosts: boolean;
  showMilestones: boolean;
  showDependencies: boolean;
  onTogglePosts: () => void;
  onToggleMilestones: () => void;
  onToggleDependencies: () => void;
  
  // Group controls
  groupBy?: GroupBy;
  onGroupByChange?: (groupBy: GroupBy) => void;
  
  // Item counts for display
  postsCount?: number;
  milestonesCount?: number;
  dependenciesCount?: number;
}

export function TimelineControls({
  scale,
  onScaleChange,
  onZoomIn,
  onZoomOut,
  onMoveLeft,
  onMoveRight,
  startDate,
  endDate,
  onDateRangeChange,
  
  // Visibility toggles
  showPosts,
  showMilestones,
  showDependencies,
  onTogglePosts,
  onToggleMilestones,
  onToggleDependencies,
  
  // Group controls
  groupBy = "none",
  onGroupByChange,
  
  // Item counts
  postsCount = 0,
  milestonesCount = 0,
  dependenciesCount = 0
}: TimelineControlsProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startDate,
    to: endDate
  });
  
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (!range) return;
    
    // Only update if both dates are selected
    if (range.from && range.to) {
      setDateRange(range);
      onDateRangeChange(range.from, range.to);
    } else if (range.from) {
      // If only start date selected, use current end date
      setDateRange({ from: range.from, to: dateRange.to || endDate });
      onDateRangeChange(range.from, dateRange.to || endDate);
    }
  };
  
  // Scale presets
  const handleScalePreset = (value: string) => {
    // Convert string to TimeScale and update
    onScaleChange(value as TimeScale);
  };
  
  // Handle group by change
  const handleGroupByChange = (value: string) => {
    if (onGroupByChange) {
      onGroupByChange(value as GroupBy);
    }
  };
  
  return (
    <div className="border-b bg-muted/40 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Range Selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs md:text-sm"
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>
                  {dateRange.from ? (
                    format(dateRange.from, "MMM d, yyyy")
                  ) : (
                    "Start date"
                  )}
                </span>
                <span>-</span>
                <span>
                  {dateRange.to ? (
                    format(dateRange.to, "MMM d, yyyy")
                  ) : (
                    "End date"
                  )}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          {/* Scale selector */}
          <Tabs
            defaultValue={scale}
            onValueChange={handleScalePreset}
            className="h-8"
          >
            <TabsList className="h-8">
              <TabsTrigger value="day" className="h-7 px-2 text-xs">Day</TabsTrigger>
              <TabsTrigger value="week" className="h-7 px-2 text-xs">Week</TabsTrigger>
              <TabsTrigger value="month" className="h-7 px-2 text-xs">Month</TabsTrigger>
              <TabsTrigger value="quarter" className="h-7 px-2 text-xs">Quarter</TabsTrigger>
              <TabsTrigger value="year" className="h-7 px-2 text-xs">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Navigation Controls */}
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onMoveLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onMoveRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Zoom Controls */}
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onZoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onZoomIn}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Group By Selector */}
          {onGroupByChange && (
            <div className="flex items-center gap-1">
              <Select value={groupBy} onValueChange={handleGroupByChange}>
                <SelectTrigger className="h-8 w-[130px] gap-1 text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">No Grouping</SelectItem>
                  <SelectItem value="status" className="flex items-center gap-1 text-xs">
                    <Layers className="h-3.5 w-3.5 inline-block" />
                    <span>Status</span>
                  </SelectItem>
                  <SelectItem value="assignee" className="flex items-center gap-1 text-xs">
                    <Users className="h-3.5 w-3.5 inline-block" />
                    <span>Assignee</span>
                  </SelectItem>
                  <SelectItem value="priority" className="flex items-center gap-1 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 inline-block" />
                    <span>Priority</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* View Toggles */}
          <div className="flex items-center gap-1 text-xs">
            <Button
              variant={showPosts ? "default" : "outline"}
              size="sm"
              onClick={onTogglePosts}
              className={cn(
                "h-8 px-2 text-xs",
                !showPosts && "text-muted-foreground"
              )}
            >
              Posts {postsCount > 0 && `(${postsCount})`}
            </Button>
            
            <Button
              variant={showMilestones ? "default" : "outline"}
              size="sm"
              onClick={onToggleMilestones}
              className={cn(
                "h-8 px-2 text-xs",
                !showMilestones && "text-muted-foreground"
              )}
            >
              Milestones {milestonesCount > 0 && `(${milestonesCount})`}
            </Button>
            
            <Button
              variant={showDependencies ? "default" : "outline"}
              size="sm"
              onClick={onToggleDependencies}
              className={cn(
                "h-8 px-2 text-xs",
                !showDependencies && "text-muted-foreground"
              )}
            >
              Dependencies
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 