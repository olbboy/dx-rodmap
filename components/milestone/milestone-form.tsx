"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Milestone } from "@/types";
import { createMilestone, updateMilestone } from "@/lib/actions/milestone";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MilestoneFormProps {
  roadmapId: string;
  initialData?: Milestone;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MilestoneForm({
  roadmapId,
  initialData,
  open,
  onOpenChange,
}: MilestoneFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;
  
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    date: initialData?.date ? new Date(initialData.date) : new Date(),
    color: initialData?.color || "#6366f1",
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle date selection
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, date }));
    }
  };
  
  // Handle color selection
  const handleColorChange = (color: string) => {
    setFormData((prev) => ({ ...prev, color }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isEditing && initialData) {
        // Update existing milestone
        await updateMilestone(initialData.id, {
          title: formData.title,
          description: formData.description || null,
          date: formData.date,
          color: formData.color || null,
        });
        
        toast.success("Milestone updated");
      } else {
        // Create new milestone
        await createMilestone({
          roadmapId,
          title: formData.title,
          description: formData.description,
          date: formData.date,
          color: formData.color,
        });
        
        toast.success("Milestone created");
      }
      
      // Close form and refresh
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving milestone:", error);
      toast.error("Failed to save milestone");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Predefined color options
  const colorOptions = [
    { value: "#6366f1", label: "Indigo" },
    { value: "#3b82f6", label: "Blue" },
    { value: "#14b8a6", label: "Teal" },
    { value: "#10b981", label: "Emerald" },
    { value: "#f59e0b", label: "Amber" },
    { value: "#ef4444", label: "Red" },
    { value: "#8b5cf6", label: "Violet" },
    { value: "#ec4899", label: "Pink" },
  ];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit milestone" : "Add new milestone"}
          </DialogTitle>
          <DialogDescription>
            Milestones help mark important events or deadlines on the timeline.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Milestone title"
              required
            />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add details about this milestone"
              rows={3}
            />
          </div>
          
          {/* Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? (
                    format(formData.date, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full border-2",
                    formData.color === color.value
                      ? "border-ring"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleColorChange(color.value)}
                  title={color.label}
                />
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : isEditing
                ? "Update milestone"
                : "Create milestone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 