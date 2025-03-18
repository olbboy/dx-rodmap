"use client";

import { useMemo } from "react";
import {
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  eachYearOfInterval,
  format,
  isSameMonth,
  isSameYear,
  isSameDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import { TimeScale } from "./timeline-controls";

export interface TimelineGridProps {
  startDate: Date;
  endDate: Date;
  scale: TimeScale;
  cellWidth: number;
  headerHeight: number;
  className?: string;
}

export function TimelineGrid({
  startDate,
  endDate,
  scale,
  cellWidth,
  headerHeight,
  className,
}: TimelineGridProps) {
  // Generate intervals based on scale
  const intervals = useMemo(() => {
    let dateIntervals: Date[] = [];
    
    switch (scale) {
      case "day":
        dateIntervals = eachDayOfInterval({ start: startDate, end: endDate });
        break;
      case "week":
        dateIntervals = eachWeekOfInterval({ start: startDate, end: endDate });
        break;
      case "month":
        dateIntervals = eachMonthOfInterval({ start: startDate, end: endDate });
        break;
      case "quarter":
        dateIntervals = eachQuarterOfInterval({ start: startDate, end: endDate });
        break;
      case "year":
        dateIntervals = eachYearOfInterval({ start: startDate, end: endDate });
        break;
      default:
        dateIntervals = eachDayOfInterval({ start: startDate, end: endDate });
    }
    
    return dateIntervals;
  }, [startDate, endDate, scale]);

  // Format function based on scale
  const formatDate = (date: Date, index: number, array: Date[]) => {
    switch (scale) {
      case "day":
        return format(date, "d");
      case "week":
        return `W${format(date, "w")}`;
      case "month":
        return format(date, "MMM");
      case "quarter":
        return `Q${Math.floor(date.getMonth() / 3) + 1}`;
      case "year":
        return format(date, "yyyy");
      default:
        return format(date, "d");
    }
  };

  // Secondary format function for day of week, month + year, etc.
  const formatSecondary = (date: Date, index: number, array: Date[]) => {
    switch (scale) {
      case "day":
        return format(date, "EEE");
      case "week":
        return format(date, "MMM yyyy");
      case "month":
        return format(date, "yyyy");
      case "quarter":
        return format(date, "yyyy");
      case "year":
        return "";
      default:
        return "";
    }
  };

  // Function to determine if we should show the secondary label
  const shouldShowSecondaryLabel = (date: Date, index: number, array: Date[]) => {
    if (index === 0) return true;
    
    const prev = array[index - 1];
    
    switch (scale) {
      case "day":
        // Show day of week for first day or when it changes
        return date.getDay() === 0 || prev.getDay() !== date.getDay();
      case "week":
      case "month":
        // Show year when it changes
        return !isSameYear(prev, date);
      case "quarter":
        // Show year when it changes
        return !isSameYear(prev, date);
      default:
        return false;
    }
  };

  // Calculate total width
  const totalWidth = intervals.length * cellWidth;

  return (
    <div 
      className={cn("relative bg-background border-b", className)}
      style={{ 
        width: totalWidth,
        height: headerHeight
      }}
    >
      {/* Top header (year, quarter, month) */}
      <div className="absolute top-0 left-0 w-full border-b" style={{ height: headerHeight / 2 }}>
        {intervals.map((date, index, array) => (
          shouldShowSecondaryLabel(date, index, array) && (
            <div
              key={`secondary-${date.toISOString()}`}
              className="absolute border-r h-full flex items-center justify-center text-xs text-muted-foreground font-medium"
              style={{
                left: index * cellWidth,
                width: calculateSecondaryLabelWidth(date, index, array, scale, cellWidth)
              }}
            >
              {formatSecondary(date, index, array)}
            </div>
          )
        ))}
      </div>

      {/* Bottom header (days, weeks) */}
      <div 
        className="absolute bottom-0 left-0 w-full"
        style={{ height: headerHeight / 2, top: headerHeight / 2 }}
      >
        {intervals.map((date, index, array) => (
          <div
            key={`primary-${date.toISOString()}`}
            className="absolute border-r h-full flex items-center justify-center text-xs font-medium"
            style={{
              left: index * cellWidth,
              width: cellWidth
            }}
          >
            {formatDate(date, index, array)}
          </div>
        ))}
      </div>

      {/* Vertical grid lines */}
      {intervals.map((date, index) => (
        <div
          key={`grid-${date.toISOString()}`}
          className="absolute top-0 w-px bg-border h-screen"
          style={{ left: index * cellWidth }}
        />
      ))}
    </div>
  );
}

// Helper function to calculate width for secondary labels
function calculateSecondaryLabelWidth(
  date: Date, 
  index: number, 
  array: Date[], 
  scale: TimeScale,
  cellWidth: number
): number {
  let width = cellWidth;
  
  // Find how many cells this secondary label should span
  let spanCount = 1;
  
  for (let i = index + 1; i < array.length; i++) {
    const current = array[i];
    
    switch (scale) {
      case "day":
        // Group by day of week
        if (current.getDay() === date.getDay()) {
          spanCount++;
        } else {
          return spanCount * cellWidth;
        }
        break;
      case "week":
      case "month":
      case "quarter":
        // Group by year
        if (isSameYear(current, date)) {
          spanCount++;
        } else {
          return spanCount * cellWidth;
        }
        break;
      default:
        return cellWidth;
    }
  }
  
  return spanCount * cellWidth;
} 