"use client";

import { useState, useRef, useEffect } from "react";
import { Milestone, Dependency, Post } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, Calendar, GitBranch, ListTodo } from "lucide-react";
import { MilestoneForm } from "@/components/milestone/milestone-form";
import { TimelineControls, TimeScale } from "./timeline-controls";
import { TimelineGrid } from "./timeline-grid";
import { TimelineItem } from "./timeline-item";
import { TimelineMilestone } from "./timeline-milestone";
import { TimelineDependency } from "./timeline-dependency";
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
    console.log('initialPosts:', initialPosts);
    console.log('initialMilestones:', initialMilestones);
    console.log('initialDependencies:', initialDependencies);
    console.log('isOwner:', isOwner);
  }, []);

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
    console.log('posts:', posts);
    console.log('milestones:', milestones);
    
    const newDateRange = calculateDateRange(posts, milestones);
    console.log('Calculated date range:', newDateRange);
    
    if (isBefore(newDateRange.start, startDate) || isAfter(newDateRange.end, endDate)) {
      console.log('Updating date range to:', newDateRange);
      setStartDate(newDateRange.start);
      setEndDate(newDateRange.end);
    }
  }, [posts, milestones]);
  
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
    
    const positions: Record<string, { left: number; width: number; top: number; height: number; }> = {};
    
    // Calculate post positions
    posts.forEach((post, index) => {
      const postStartDate = post.start_date ? new Date(post.start_date) : new Date();
      const postEndDate = post.end_date ? new Date(post.end_date) : addDays(postStartDate, 7);
      
      const daysFromStart = differenceInDays(postStartDate, startDate);
      const duration = differenceInDays(postEndDate, postStartDate) + 1;
      
      positions[post.id] = {
        left: daysFromStart * cellWidth,
        width: duration * cellWidth,
        top: headerHeight + 10 + (index * (rowHeight + 10)),
        height: rowHeight,
      };
    });
    
    // Calculate milestone positions
    milestones.forEach((milestone) => {
      try {
        console.log('Processing milestone:', milestone);
        
        // Check if date field exists
        if (!milestone.date) {
          console.error('Milestone is missing date field:', milestone);
          return;
        }
        
        const milestoneDate = new Date(milestone.date);
        console.log('Milestone date parsed as:', milestoneDate);
        
        const daysFromStart = differenceInDays(milestoneDate, startDate);
        console.log('Days from start:', daysFromStart);
        
        positions[milestone.id] = {
          left: daysFromStart * cellWidth,
          width: 0, // Milestones don't have width
          top: 0, // Will be positioned relative to the grid's top
          height: posts.length * (rowHeight + 10), // Full height of the content
        };
      } catch (err) {
        console.error('Error processing milestone:', err, milestone);
      }
    });
    
    console.log('Item positions calculated:', positions);
    setItemPositions(positions);
  }, [posts, milestones, startDate, endDate, cellWidth, rowHeight, headerHeight]);
  
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
    
    // Check posts
    posts.forEach(post => {
      const startDate = post.start_date ? new Date(post.start_date) : null;
      const endDate = post.end_date ? new Date(post.end_date) : null;
      
      if (startDate && (earliest === null || startDate < earliest)) earliest = startDate;
      if (endDate && (latest === null || endDate > latest)) latest = endDate;
    });
    
    // Check milestones
    milestones.forEach(milestone => {
      const milestoneDate = new Date(milestone.date);
      
      if (earliest === null || milestoneDate < earliest) earliest = milestoneDate;
      if (latest === null || milestoneDate > latest) latest = milestoneDate;
    });
    
    // Add padding to dates
    const startPadding = 7; // days
    const endPadding = 30; // days
    
    earliest = subDays(earliest, startPadding);
    latest = addDays(latest, endPadding);
    
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
  
  return (
    <div className="flex flex-col h-full border rounded-md bg-background">
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
        <div></div>
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
          
          {/* Render posts */}
          <div className="relative">
            {showPosts && posts.map((post, index) => {
              const position = itemPositions[post.id];
              if (!position) return null;
              
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
            })}
          </div>
          
          {/* Render milestones */}
          <div className="relative">
            {showMilestones && milestones.map((milestone) => {
              const position = itemPositions[milestone.id];
              if (!position) return null;
              
              return (
                <TimelineMilestone
                  key={milestone.id}
                  milestone={milestone}
                  left={position.left}
                  height={position.height}
                  onEdit={isOwner ? (milestone) => {
                    setSelectedMilestone(milestone);
                    setShowMilestoneForm(true);
                  } : undefined}
                  onDelete={isOwner ? (milestone) => {
                    // Delete milestone logic
                    if (confirm(`Are you sure you want to delete "${milestone.title}"?`)) {
                      // Call delete API
                    }
                  } : undefined}
                />
              );
            })}
          </div>
          
          {/* Render dependencies */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {showDependencies && dependencies.map(dependency => {
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