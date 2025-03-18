"use client";

import { useState, useRef, useEffect } from "react";
import { Milestone, Dependency, Post } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, Calendar, GitBranch, ListTodo } from "lucide-react";
import { MilestoneForm } from "@/components/milestone/milestone-form";
import { addDays, differenceInDays, format, isAfter, isBefore, subDays } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuCheckboxItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

// Define TimeScale type ahead of the imports
type TimeScale = "day" | "week" | "month" | "quarter" | "year";

// Import local components with relative paths
// Use dynamic import to make it work with the other components
let TimelineControls: any, TimelineGrid: any, TimelineItem: any, TimelineMilestone: any, TimelineDependency: any;

// Set the imported components
try {
  const controlsModule = require("./timeline-controls");
  TimelineControls = controlsModule.TimelineControls;
  
  const gridModule = require("./timeline-grid");
  TimelineGrid = gridModule.TimelineGrid;
  
  const itemModule = require("./timeline-item");
  TimelineItem = itemModule.TimelineItem;
  
  const milestoneModule = require("./timeline-milestone");
  TimelineMilestone = milestoneModule.TimelineMilestone;
  
  const dependencyModule = require("./timeline-dependency");
  TimelineDependency = dependencyModule.TimelineDependency;
} catch (error) {
  console.error("Error loading timeline components:", error);
  // Provide dummy components as fallback
  TimelineControls = (props: any) => <div>Timeline Controls</div>;
  TimelineGrid = (props: any) => <div>Timeline Grid</div>;
  TimelineItem = (props: any) => <div>Timeline Item</div>;
  TimelineMilestone = (props: any) => <div>Timeline Milestone</div>;
  TimelineDependency = (props: any) => <div>Timeline Dependency</div>;
}

interface TimelineViewProps {
  roadmapId: string;
  initialPosts: Post[];
  initialMilestones: Milestone[];
  initialDependencies: Dependency[];
  isOwner: boolean;
}

export function TimelineView({
  roadmapId,
  initialPosts,
  initialMilestones,
  initialDependencies,
  isOwner
}: TimelineViewProps) {
  // Add debug logging when the component mounts
  useEffect(() => {
    console.log('TimelineView Component Mounted with:');
    console.log('roadmapId:', roadmapId);
    console.log('initialPosts length:', initialPosts.length);
    console.log('initialMilestones length:', initialMilestones.length);
    console.log('initialDependencies length:', initialDependencies.length);
    console.log('isOwner:', isOwner);
    
    // Log sample data if available
    if (initialPosts.length > 0) {
      console.log('Sample post:', initialPosts[0]);
    }
    
    if (initialMilestones.length > 0) {
      console.log('Sample milestone:', initialMilestones[0]);
    }
    
    if (initialDependencies.length > 0) {
      console.log('Sample dependency:', initialDependencies[0]);
    }

    // Set a more appropriate date range based on the actual data
    const dateRange = calculateDateRange(initialPosts, initialMilestones);
    console.log('Initial date range calculation:', dateRange);
    setStartDate(dateRange.start);
    setEndDate(dateRange.end);
  }, [roadmapId, initialPosts, initialMilestones, initialDependencies, isOwner]);

  // Timeline state
  const [scale, setScale] = useState<TimeScale>("month");
  const [cellWidth, setCellWidth] = useState(150);
  const [rowHeight, setRowHeight] = useState(60);
  const [headerHeight, setHeaderHeight] = useState(50);
  const [viewportPosition, setViewportPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [showDependencyCreator, setShowDependencyCreator] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [sourceDependencyId, setSourceDependencyId] = useState<string | null>(null);
  
  // Add a new state to track if items are ready to render
  const [itemsReady, setItemsReady] = useState(false);
  
  // Date range state
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(addDays(new Date(), 90));
  
  // Data state
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [dependencies, setDependencies] = useState<Dependency[]>(initialDependencies);
  
  // Post and milestone positions map (for dependencies)
  const [itemPositions, setItemPositions] = useState<Record<string, { left: number; width: number; top: number; height: number; }>>({}); 
  
  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  
  // Visibility states
  const [showPosts, setShowPosts] = useState(true);
  const [showMilestones, setShowMilestones] = useState(true);
  const [showDependencies, setShowDependencies] = useState(true);
  
  // Toggle visibility handlers
  const togglePosts = () => setShowPosts(!showPosts);
  const toggleMilestones = () => setShowMilestones(!showMilestones);
  const toggleDependencies = () => setShowDependencies(!showDependencies);
  
  // Expand date range if needed based on posts and milestones
  useEffect(() => {
    console.log('Calculating date range with:');
    console.log('posts:', posts.length);
    console.log('milestones:', milestones.length);
    
    const newDateRange = calculateDateRange(posts, milestones);
    console.log('Calculated date range:', newDateRange);
    
    if (isBefore(newDateRange.start, startDate) || isAfter(newDateRange.end, endDate)) {
      console.log('Updating date range to:', newDateRange);
      setStartDate(newDateRange.start);
      setEndDate(newDateRange.end);
    }
  }, [posts, milestones, startDate, endDate]);
  
  // Initialize viewport on component mount
  useEffect(() => {
    if (timelineRef.current) {
      const handleResize = () => {
        // Update on resize
      };
      
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);
  
  // Calculate post and milestone positions
  useEffect(() => {
    console.log('Calculating item positions with:');
    console.log('posts count:', posts.length);
    console.log('milestones count:', milestones.length);
    console.log('start date:', startDate, startDate.toISOString());
    console.log('end date:', endDate, endDate.toISOString());
    
    const positions: Record<string, { left: number; width: number; top: number; height: number; }> = {};
    
    // Calculate post positions
    posts.forEach((post, index) => {
      try {
        console.log('Post calculation for:', post.title, 'id:', post.id);
        
        // Parse dates 
        const postStartDate = post.start_date ? new Date(post.start_date) : new Date();
        const postEndDate = post.end_date ? new Date(post.end_date) : addDays(postStartDate, 7);
        
        console.log('Post dates:', { 
          startDate: postStartDate.toISOString(), 
          endDate: postEndDate.toISOString(), 
          timelineStartDate: startDate.toISOString()
        });
        
        // Calculate days - FIXED: swap parameter order
        // The correct order is: differenceInDays(laterDate, earlierDate)
        let daysFromStart = differenceInDays(startDate, postStartDate);
        
        console.log('Raw days from start calculation:', daysFromStart);
        
        // Correct the sign (we need positive values)
        daysFromStart = -daysFromStart;
        
        // Ensure days is not negative which could happen if postStartDate is before startDate
        if (daysFromStart < 0) {
          console.warn(`Post ${post.title} starts before timeline range, adjusting position`);
          daysFromStart = 0;
        }
        
        // Calculate duration - FIXED: swap parameter order for correct calculation
        let duration = differenceInDays(postStartDate, postEndDate);
        
        console.log('Raw duration calculation:', duration);
        
        // Correct the sign (we need positive values)
        duration = -duration;
        
        // Ensure duration is at least 1 day
        if (duration < 1) {
          console.warn(`Post ${post.title} has duration less than 1 day, setting to minimum`);
          duration = 1;
        }
        
        console.log('Post position values:', { daysFromStart, duration });
        
        // Calculate position
        positions[post.id] = {
          left: daysFromStart * cellWidth,
          width: duration * cellWidth,
          top: headerHeight + 10 + (index * (rowHeight + 10)),
          height: rowHeight,
        };
        
        console.log('Position calculated for post:', positions[post.id]);
      } catch (err) {
        console.error(`Error calculating position for post: ${post.title}`, err);
      }
    });
    
    // Calculate milestone positions
    milestones.forEach((milestone: Milestone) => {
      try {
        console.log('Milestone calculation for:', milestone.title, 'id:', milestone.id);
        
        // Check if date field exists
        if (!milestone.date) {
          console.error('Milestone is missing date field:', milestone);
          return;
        }
        
        // Parse milestone date
        const milestoneDate = new Date(milestone.date);
        console.log('Milestone date parsed as:', milestoneDate.toISOString(), 'timeline start date:', startDate.toISOString());
        
        // Calculate days - FIXED: swap parameter order
        // The correct order is: differenceInDays(laterDate, earlierDate)
        let daysFromStart = differenceInDays(startDate, milestoneDate);
        
        console.log('Raw milestone days calculation:', daysFromStart);
        
        // Correct the sign (we need positive values)
        daysFromStart = -daysFromStart;
        
        // Ensure days is not negative
        if (daysFromStart < 0) {
          console.warn(`Milestone ${milestone.title} is before timeline range, adjusting position`);
          daysFromStart = 0;
        }
        
        console.log('Milestone days from start:', daysFromStart);
        
        // Ensure we have posts to calculate height
        const contentHeight = posts.length > 0 
          ? posts.length * (rowHeight + 10)
          : 200; // Default height if no posts
        
        // Calculate position
        positions[milestone.id] = {
          left: daysFromStart * cellWidth,
          width: 0, // Milestones don't have width
          top: 0, // Will be positioned relative to the grid's top
          height: contentHeight, // Full height of the content
        };
        
        console.log('Position calculated for milestone:', positions[milestone.id]);
      } catch (err) {
        console.error('Error processing milestone:', err, milestone);
      }
    });
    
    console.log('All item positions calculated:', positions);
    setItemPositions(positions);
  }, [posts, milestones, startDate, endDate, cellWidth, rowHeight, headerHeight]);
  
  // Add effect to automatically scroll to show items after positions are calculated
  useEffect(() => {
    // Only run if positions have been calculated
    if (Object.keys(itemPositions).length > 0 && timelineContentRef.current) {
      console.log('Positions calculated, adjusting viewport');
      
      // Find the leftmost position to scroll to
      let minPosition = Number.MAX_SAFE_INTEGER;
      Object.values(itemPositions).forEach(pos => {
        if (pos.left < minPosition) {
          minPosition = pos.left;
        }
      });
      
      // Subtract some padding to show context before the first item
      const scrollToPosition = Math.max(0, minPosition - (cellWidth * 2));
      console.log('Scrolling to position:', scrollToPosition);
      
      // Set the scroll position of the container
      if (timelineContentRef.current.parentElement) {
        timelineContentRef.current.parentElement.scrollLeft = scrollToPosition;
      }
      
      // Mark items as ready to render
      setItemsReady(true);
    }
  }, [itemPositions, cellWidth]);
  
  // Add a useEffect to immediately focus on a specific range if dates are in the future
  useEffect(() => {
    if (posts.length > 0 || milestones.length > 0) {
      // Find dates in the data
      const dates: Date[] = [];
      
      // Add post dates
      posts.forEach(post => {
        if (post.start_date) dates.push(new Date(post.start_date));
        if (post.end_date) dates.push(new Date(post.end_date));
      });
      
      // Add milestone dates
      milestones.forEach(milestone => {
        if (milestone.date) dates.push(new Date(milestone.date));
      });
      
      if (dates.length > 0) {
        // Sort dates to find earliest and latest
        dates.sort((a, b) => a.getTime() - b.getTime());
        
        const earliestDate = dates[0];
        const latestDate = dates[dates.length - 1];
        
        // Add padding to dates
        const newStartDate = subDays(earliestDate, 7);
        const newEndDate = addDays(latestDate, 7);
        
        console.log('Adjusting date range to:', {
          start: newStartDate.toISOString(),
          end: newEndDate.toISOString()
        });
        
        // Update date range
        setStartDate(newStartDate);
        setEndDate(newEndDate);
      }
    }
  }, [posts, milestones]);
  
  // Handle mouse/touch events for dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left mouse button
    setIsDragging(true);
    setDragStart(e.clientX);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const dragDistance = e.clientX - dragStart;
    const newPosition = viewportPosition - dragDistance;
    
    // Clamp position to prevent dragging beyond timeline bounds
    const totalWidth = differenceInDays(endDate, startDate) * cellWidth;
    const containerWidth = timelineRef.current?.clientWidth || 0;
    const maxPosition = Math.max(0, totalWidth - containerWidth);
    
    setViewportPosition(Math.max(0, Math.min(newPosition, maxPosition)));
    setDragStart(e.clientX);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handlers for timeline navigation and zoom
  const handleZoomIn = () => {
    setCellWidth(prev => Math.min(prev + 30, 300));
  };
  
  const handleZoomOut = () => {
    setCellWidth(prev => Math.max(prev - 30, 60));
  };
  
  const handleMoveLeft = () => {
    if (timelineContentRef.current) {
      const scrollAmount = -10 * cellWidth;
      timelineContentRef.current.scrollLeft += scrollAmount;
    }
  };
  
  const handleMoveRight = () => {
    if (timelineContentRef.current) {
      const scrollAmount = 10 * cellWidth;
      timelineContentRef.current.scrollLeft += scrollAmount;
    }
  };
  
  // Handle date range change
  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setViewportPosition(0); // Reset position when date range changes
  };
  
  // Helper functions
  function calculateDateRange(posts: Post[], milestones: Milestone[]) {
    let earliest = new Date();
    let latest = new Date();
    let hasData = false;
    
    console.log('Calculating date range from:', { 
      posts: posts.length,
      milestones: milestones.length
    });
    
    // Check posts
    posts.forEach(post => {
      console.log('Processing post date:', post.title, post.start_date, post.end_date);
      const startDate = post.start_date ? new Date(post.start_date) : null;
      const endDate = post.end_date ? new Date(post.end_date) : null;
      
      if (startDate) {
        if (!hasData || startDate < earliest) {
          earliest = startDate;
          hasData = true;
        }
      }
      
      if (endDate) {
        if (!hasData || endDate > latest) {
          latest = endDate;
          hasData = true;
        }
      }
    });
    
    // Check milestones
    milestones.forEach(milestone => {
      console.log('Processing milestone date:', milestone.title, milestone.date);
      try {
        const milestoneDate = new Date(milestone.date);
        if (!isNaN(milestoneDate.getTime())) {
          if (!hasData || milestoneDate < earliest) {
            earliest = milestoneDate;
            hasData = true;
          }
          
          if (!hasData || milestoneDate > latest) {
            latest = milestoneDate;
            hasData = true;
          }
        } else {
          console.error('Invalid milestone date:', milestone.date);
        }
      } catch (err) {
        console.error('Error processing milestone date:', err, milestone);
      }
    });
    
    // If no valid dates found, use default date range
    if (!hasData) {
      earliest = subDays(new Date(), 30);
      latest = addDays(new Date(), 90);
    } else {
      // Add padding to dates
      const startPadding = 30; // days
      const endPadding = 30; // days
      
      earliest = subDays(earliest, startPadding);
      latest = addDays(latest, endPadding);
    }
    
    return { start: earliest, end: latest };
  }
  
  // Handlers for item interactions
  const handlePostEdit = (post: Post) => {
    // Redirect to post edit page or open modal
    window.location.href = `/roadmaps/${roadmapId}/posts/${post.id}`;
  };
  
  const handlePostDelete = (post: Post) => {
    // Delete post logic
    if (confirm(`Are you sure you want to delete "${post.title}"?`)) {
      // Call delete API
    }
  };
  
  const handleCreateDependency = (sourcePostId: string) => {
    setSourceDependencyId(sourcePostId);
    setShowDependencyCreator(true);
  };
  
  const handleDependencyDelete = (dependency: Dependency) => {
    // Delete dependency logic
    if (confirm("Are you sure you want to delete this dependency?")) {
      // Call delete API
    }
  };
  
  // Add useEffect to ensure content is visible after all calculations
  useEffect(() => {
    // Since the timeline has very large numbers (4500+ pixels from left),
    // we need to ensure the user can see the items without having to scroll manually
    const hasItems = posts.length > 0 || milestones.length > 0;
    
    if (hasItems && Object.keys(itemPositions).length > 0 && timelineRef.current) {
      // Get the minimum left position (earliest item)
      let minLeft = Number.MAX_SAFE_INTEGER;
      Object.values(itemPositions).forEach(pos => {
        if (pos.left < minLeft) {
          minLeft = pos.left;
        }
      });
      
      if (minLeft !== Number.MAX_SAFE_INTEGER) {
        // Add a slight offset to show context before the first item
        const scrollPosition = Math.max(0, minLeft - (cellWidth * 2));
        
        console.log('Setting initial scroll position to show items:', scrollPosition);
        
        // Set scroll position directly on the container
        if (timelineRef.current) {
          requestAnimationFrame(() => {
            if (timelineRef.current) {
              timelineRef.current.scrollLeft = scrollPosition;
              console.log('Scroll position set to:', timelineRef.current.scrollLeft);
            }
          });
        }
      }
    }
  }, [itemPositions, cellWidth, posts.length, milestones.length]);
  
  // Add a new function to jump to today
  const handleJumpToToday = () => {
    if (timelineContentRef.current && timelineRef.current) {
      const today = new Date();
      const daysFromStart = differenceInDays(today, startDate);
      
      // Adjust sign if needed
      const adjustedDays = daysFromStart < 0 ? -daysFromStart : daysFromStart;
      
      const position = adjustedDays * cellWidth;
      
      // Center today in the viewport
      const containerWidth = timelineRef.current.clientWidth;
      const scrollPosition = Math.max(0, position - (containerWidth / 2));
      
      console.log('Jumping to today at position:', position, 'scrolling to:', scrollPosition);
      
      timelineRef.current.scrollLeft = scrollPosition;
    }
  };
  
  return (
    <div className="flex flex-col h-full border rounded-md bg-background">
      {/* Debug information */}
      <div className="p-2 bg-muted text-muted-foreground text-xs">
        <details>
          <summary className="cursor-pointer font-medium">Debug Information</summary>
          <div className="mt-2 space-y-1">
            <div>Posts: {posts.length} | Milestones: {milestones.length} | Dependencies: {dependencies.length}</div>
            <div>Date Range: {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}</div>
            <div>Cell Width: {cellWidth}px | Row Height: {rowHeight}px</div>
            <div>Calculated Positions: {Object.keys(itemPositions).length}</div>
            <div>Timeline Content Ref: {timelineContentRef.current ? 'Available' : 'Not Available'}</div>
            <div>Items Ready: {itemsReady ? 'Yes' : 'No'}</div>
          </div>
        </details>
      </div>
      
      {/* Controls */}
      <TimelineControls
        scale={scale}
        onScaleChange={setScale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onMoveLeft={handleMoveLeft}
        onMoveRight={handleMoveRight}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={handleDateRangeChange}
        // Visibility controls
        showPosts={showPosts}
        showMilestones={showMilestones}
        showDependencies={showDependencies}
        onTogglePosts={togglePosts}
        onToggleMilestones={toggleMilestones}
        onToggleDependencies={toggleDependencies}
      />
      
      <div className="border-b bg-background p-3 flex justify-between items-center">
        <div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleJumpToToday}
            className="text-xs"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Jump to Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              <Button 
                size="sm"
                onClick={() => {
                  setSelectedMilestone(null);
                  setShowMilestoneForm(true);
                }}
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Milestone
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div 
        className="flex-1 overflow-auto relative"
        ref={timelineRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Loading indicator when items are not ready */}
        {!itemsReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <div className="flex flex-col items-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="mt-2 text-sm text-muted-foreground">Calculating timeline...</p>
            </div>
          </div>
        )}
        
        {/* Empty state if no posts or milestones */}
        {itemsReady && posts.length === 0 && milestones.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center max-w-md text-center p-4">
              <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No timeline items</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add posts with dates or milestones to populate the timeline.
              </p>
              {isOwner && (
                <Button
                  onClick={() => setShowMilestoneForm(true)}
                  className="mt-4"
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Milestone
                </Button>
              )}
            </div>
          </div>
        )}
        
        <div 
          className="relative"
          ref={timelineContentRef}
          style={{ 
            transform: `translateX(-${viewportPosition}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease'
          }}
        >
          <TimelineGrid 
            startDate={startDate}
            endDate={endDate}
            scale={scale}
            cellWidth={cellWidth}
            headerHeight={headerHeight}
          />
          
          {/* Render posts - only when ready */}
          <div className="relative">
            {itemsReady && showPosts && posts.map((post, index) => {
              try {
                console.log(`Rendering post: ${post.title}, position:`, itemPositions[post.id]);
                const position = itemPositions[post.id];
                if (!position) {
                  console.warn(`No position calculated for post: ${post.title} with id ${post.id}`);
                  return null;
                }
                
                return (
                  <TimelineItem
                    key={post.id}
                    post={post}
                    startDate={startDate}
                    endDate={endDate}
                    cellWidth={cellWidth}
                    rowHeight={rowHeight}
                    left={position.left}
                    top={position.top}
                    width={position.width}
                    onEdit={isOwner ? handlePostEdit : undefined}
                    onDelete={isOwner ? handlePostDelete : undefined}
                    onCreateDependency={isOwner ? handleCreateDependency : undefined}
                  />
                );
              } catch (error) {
                console.error(`Error rendering post: ${post?.title || 'unknown'}`, error);
                return null;
              }
            })}
          </div>
          
          {/* Render milestones - only when ready */}
          <div className="relative">
            {itemsReady && showMilestones && milestones.map((milestone) => {
              try {
                console.log(`Rendering milestone: ${milestone.title}, position:`, itemPositions[milestone.id]);
                const position = itemPositions[milestone.id];
                if (!position) {
                  console.warn(`No position calculated for milestone: ${milestone.title} with id ${milestone.id}`);
                  return null;
                }
                
                return (
                  <TimelineMilestone
                    key={milestone.id}
                    milestone={milestone}
                    left={position.left}
                    height={position.height}
                    onEdit={isOwner ? (m: Milestone) => {
                      console.log('Edit milestone clicked:', m);
                      setSelectedMilestone(m);
                      setShowMilestoneForm(true);
                    } : undefined}
                    onDelete={isOwner ? (m: Milestone) => {
                      // Delete milestone logic
                      if (confirm(`Are you sure you want to delete "${m.title}"?`)) {
                        // Call delete API
                      }
                    } : undefined}
                  />
                );
              } catch (error) {
                console.error(`Error rendering milestone: ${milestone?.title || 'unknown'}`, error);
                return null;
              }
            })}
          </div>
          
          {/* Render dependencies - only when ready */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {itemsReady && showDependencies && dependencies.map(dependency => {
              const sourcePosition = itemPositions[dependency.sourceId];
              const targetPosition = itemPositions[dependency.targetId];
              
              if (!sourcePosition || !targetPosition) return null;
              
              // Find the source and target posts
              const sourcePost = posts.find(p => p.id === dependency.sourceId);
              const targetPost = posts.find(p => p.id === dependency.targetId);
              
              if (!sourcePost || !targetPost) return null;
              
              return (
                <TimelineDependency
                  key={dependency.id}
                  dependency={dependency}
                  sourcePost={sourcePost}
                  targetPost={targetPost}
                  sourceRect={sourcePosition}
                  targetRect={targetPosition}
                  onDelete={isOwner ? handleDependencyDelete : undefined}
                />
              );
            })}
          </svg>
        </div>
      </div>
      
      {/* Add milestone form dialog */}
      {showMilestoneForm && (
        <MilestoneForm
          roadmapId={roadmapId}
          initialData={selectedMilestone || undefined}
          open={showMilestoneForm}
          onOpenChange={(open) => {
            setShowMilestoneForm(open);
            if (!open) setSelectedMilestone(null);
          }}
        />
      )}
      
      {/* Add dependency creator dialog */}
      {showDependencyCreator && (
        <div>
          {/* Will implement the DependencyCreator component next */}
        </div>
      )}
    </div>
  );
} 