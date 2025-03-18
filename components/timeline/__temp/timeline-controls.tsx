"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Calendar as CalendarIcon,
  RefreshCw,
  Eye,
  ListTodo,
  Calendar as CalendarMilestone,
  GitBranch,
  Settings
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuCheckboxItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export type TimeScale = "day" | "week" | "month" | "quarter" | "year";

export interface TimelineControlsProps {
  scale: TimeScale;
  onScaleChange: (scale: TimeScale) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  startDate: Date;
  endDate: Date;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  // Visibility controls
  showPosts: boolean;
  showMilestones: boolean;
  showDependencies: boolean;
  onTogglePosts: () => void;
  onToggleMilestones: () => void;
  onToggleDependencies: () => void;
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
  // Visibility controls
  showPosts,
  showMilestones,
  showDependencies,
  onTogglePosts,
  onToggleMilestones,
  onToggleDependencies
}: TimelineControlsProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentStartDate, setCurrentStartDate] = useState<Date>(startDate);
  const [currentEndDate, setCurrentEndDate] = useState<Date>(endDate);

  const handleDateRangeApply = () => {
    onDateRangeChange(currentStartDate, currentEndDate);
    setShowDatePicker(false);
  };

  return (
    <div className="flex items-center justify-between p-3 border-b bg-background sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Select
          value={scale}
          onValueChange={(value) => onScaleChange(value as TimeScale)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Scale" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="quarter">Quarter</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={onZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Visibility Controls */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="ml-2">
              <Eye className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Visibility</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Show/Hide Elements</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showPosts}
              onCheckedChange={onTogglePosts}
            >
              <ListTodo className="h-4 w-4 mr-2" />
              Posts
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showMilestones}
              onCheckedChange={onToggleMilestones}
            >
              <CalendarMilestone className="h-4 w-4 mr-2" />
              Milestones
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showDependencies}
              onCheckedChange={onToggleDependencies}
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Dependencies
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={onMoveLeft}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>{format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Start Date</label>
                  <div className="border rounded-md p-2">
                    <Calendar
                      mode="single"
                      selected={currentStartDate}
                      onSelect={(date) => date && setCurrentStartDate(date)}
                      initialFocus
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">End Date</label>
                  <div className="border rounded-md p-2">
                    <Calendar
                      mode="single"
                      selected={currentEndDate}
                      onSelect={(date) => date && setCurrentEndDate(date)}
                      initialFocus
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDatePicker(false)}>
                  Cancel
                </Button>
                <Button onClick={handleDateRangeApply}>
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Button variant="outline" size="icon" onClick={onMoveRight}>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="icon" onClick={() => onDateRangeChange(startDate, endDate)}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 