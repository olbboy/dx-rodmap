"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  HelpCircle, 
  Square, 
  Milestone as MilestoneIcon, 
  ArrowRight, 
  CheckSquare,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export interface TimelineLegendProps {
  className?: string;
  showGuide?: boolean;
}

export function TimelineLegend({
  className,
  showGuide = true
}: TimelineLegendProps) {
  const [isGuideExpanded, setIsGuideExpanded] = useState(false);
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn("gap-1.5", className)}
        >
          <HelpCircle className="h-4 w-4" />
          Legend
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="end">
        <div className="p-4 space-y-4">
          <h3 className="font-medium text-sm">Timeline Elements</h3>
          
          <div className="space-y-2">
            {/* Post */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-5 bg-primary/20 rounded border border-primary/50 flex-shrink-0"></div>
              <span className="text-sm">Post</span>
              <span className="text-xs text-muted-foreground ml-auto">Task or feature</span>
            </div>
            
            {/* Milestone */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-5 flex items-center justify-center flex-shrink-0">
                <div className="h-5 w-0.5 bg-destructive"></div>
                <MilestoneIcon className="h-3.5 w-3.5 text-destructive absolute" />
              </div>
              <span className="text-sm">Milestone</span>
              <span className="text-xs text-muted-foreground ml-auto">Key date or event</span>
            </div>
            
            {/* Dependency */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-5 flex items-center justify-center flex-shrink-0">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm">Dependency</span>
              <span className="text-xs text-muted-foreground ml-auto">Relationship between posts</span>
            </div>
            
            {/* Critical Path */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-5 flex items-center justify-center flex-shrink-0">
                <div className="h-1 w-6 bg-destructive rounded-full"></div>
              </div>
              <span className="text-sm">Critical Path</span>
              <span className="text-xs text-muted-foreground ml-auto">Important dependency chain</span>
            </div>
            
            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-5 bg-primary/20 rounded border border-primary/50 flex-shrink-0 overflow-hidden">
                <div className="h-full w-1/2 bg-primary/50"></div>
              </div>
              <span className="text-sm">Progress Indicator</span>
              <span className="text-xs text-muted-foreground ml-auto">Completion progress</span>
            </div>
          </div>
          
          {showGuide && (
            <>
              <Separator />
              
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-between p-0 h-8"
                  onClick={() => setIsGuideExpanded(!isGuideExpanded)}
                >
                  <span className="font-medium text-sm">Quick User Guide</span>
                  {isGuideExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                
                {isGuideExpanded && (
                  <div className="mt-2 space-y-3 text-xs text-muted-foreground">
                    <div>
                      <p className="font-medium text-foreground">Navigation</p>
                      <p>Use the zoom controls and date range selectors to adjust the timeline view.</p>
                      <p>Drag the timeline horizontally to scroll through time periods.</p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-foreground">Posts & Milestones</p>
                      <p>Click on a post to see details and access actions like edit or delete.</p>
                      <p>Add new posts and milestones using the buttons at the top of the timeline.</p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-foreground">Dependencies</p>
                      <p>Create dependencies between posts to show relationships.</p>
                      <p>Click the chain icon on a post to create a dependency to another post.</p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-foreground">Filtering & Grouping</p>
                      <p>Use the filter panel to show only specific posts based on criteria.</p>
                      <p>Group posts by status, assignee, or priority to organize your view.</p>
                    </div>
                    
                    <div>
                      <p className="font-medium text-foreground">Pro Tip</p>
                      <p>For better viewing on small screens, collapse groups you're not currently working with.</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 