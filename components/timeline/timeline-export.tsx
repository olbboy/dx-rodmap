"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileDown, FileJson, FileText } from "lucide-react";
import { Milestone, Post, Dependency } from "@/types";
import { format } from "date-fns";

// Define export formats
type ExportFormat = "json" | "csv";

interface TimelineExportProps {
  timelineRef?: React.RefObject<HTMLDivElement>;
  posts: Post[];
  milestones: Milestone[];
  dependencies: Dependency[];
  className?: string;
  roadmapName?: string;
}

export function TimelineExport({
  timelineRef,
  posts,
  milestones,
  dependencies,
  className = "",
  roadmapName = "Roadmap"
}: TimelineExportProps) {
  const [isExporting, setIsExporting] = React.useState(false);

  // Function to generate filename based on format and current date
  const getFilename = (exportFormat: ExportFormat): string => {
    const dateStr = format(new Date(), "yyyy-MM-dd");
    const sanitizedName = roadmapName.replace(/[^a-z0-9]/gi, "-").toLowerCase();
    
    return `${sanitizedName}-timeline-${dateStr}.${exportFormat}`;
  };

  // Function to trigger download of a file
  const downloadAsFile = (data: string, filename: string) => {
    const blob = new Blob([data], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  // Export as JSON
  const exportAsJson = async () => {
    try {
      setIsExporting(true);
      
      // Prepare data object with posts, milestones, and dependencies
      const data = {
        roadmapName,
        exportDate: new Date().toISOString(),
        posts,
        milestones,
        dependencies
      };
      
      // Convert to JSON string with pretty formatting
      const jsonString = JSON.stringify(data, null, 2);
      
      // Download the file
      downloadAsFile(jsonString, getFilename("json"));
      
      alert("Timeline exported as JSON");
    } catch (error) {
      console.error("Error exporting as JSON:", error);
      alert("Error exporting timeline as JSON");
    } finally {
      setIsExporting(false);
    }
  };

  // Export as CSV (only posts and milestones)
  const exportAsCsv = async () => {
    try {
      setIsExporting(true);
      
      // Create CSV headers
      const headers = [
        "Type",
        "ID",
        "Title",
        "Description",
        "Start Date",
        "End Date",
        "Status",
        "Priority",
        "Assignee",
        "Tags"
      ].join(",");
      
      // Create rows for posts
      const postRows = posts.map(post => [
        "Post",
        post.id,
        `"${(post.title || "").replace(/"/g, '""')}"`,
        `"${(post.description || "").replace(/"/g, '""')}"`,
        post.start_date || "",
        post.end_date || "",
        post.status_id || "",
        post.priority || "",
        post.assignee_id || "",
        (post.tags || []).join(";")
      ].join(","));
      
      // Create rows for milestones
      const milestoneRows = milestones.map(milestone => [
        "Milestone",
        milestone.id,
        `"${(milestone.title || "").replace(/"/g, '""')}"`,
        `"${(milestone.description || "").replace(/"/g, '""')}"`,
        milestone.date || "",
        "", // End date (empty for milestones)
        "", // Status (empty for milestones)
        "", // Priority (empty for milestones)
        "", // Assignee (empty for milestones)
        "" // Tags (empty for milestones)
      ].join(","));
      
      // Combine headers and rows
      const csvContent = [headers, ...postRows, ...milestoneRows].join("\n");
      
      // Download the file
      downloadAsFile(csvContent, getFilename("csv"));
      
      alert("Timeline exported as CSV");
    } catch (error) {
      console.error("Error exporting as CSV:", error);
      alert("Error exporting timeline as CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting}
          className="h-8 px-2 text-xs gap-1"
        >
          <FileDown className="h-3.5 w-3.5" />
          <span>Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs">Export Timeline</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={exportAsJson}
          disabled={isExporting}
          className="text-xs"
        >
          <FileJson className="h-4 w-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={exportAsCsv}
          disabled={isExporting}
          className="text-xs"
        >
          <FileText className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 