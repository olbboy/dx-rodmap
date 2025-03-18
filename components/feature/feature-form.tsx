"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createFeature, updateFeature, FeatureFormData } from "@/lib/actions/feature";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { Feature, Status, Tag, User } from "@/types";

interface FeatureFormProps {
  roadmapId: string;
  feature?: Feature;
  statuses: Status[];
  tags: Tag[];
  users: User[];
}

export function FeatureForm({
  roadmapId,
  feature,
  statuses,
  tags,
  users,
}: FeatureFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [formData, setFormData] = useState<FeatureFormData>({
    title: feature?.title || "",
    description: feature?.description || "",
    status_id: feature?.status_id || statuses[0]?.id,
    assignee_id: feature?.assignee_id || "",
    start_date: feature?.start_date || "",
    due_date: feature?.due_date || "",
    tags: [],
  });

  // Load initially selected tags when editing
  useEffect(() => {
    if (feature?.tags) {
      setSelectedTags(feature.tags);
      setFormData(prev => ({
        ...prev,
        tags: feature.tags?.map(tag => tag.id),
      }));
    }
  }, [feature]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | null) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [name]: date.toISOString(),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const addTag = (tag: Tag) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      const newSelectedTags = [...selectedTags, tag];
      setSelectedTags(newSelectedTags);
      setFormData(prev => ({
        ...prev,
        tags: newSelectedTags.map(tag => tag.id),
      }));
    }
  };

  const removeTag = (tagId: string) => {
    const newSelectedTags = selectedTags.filter(tag => tag.id !== tagId);
    setSelectedTags(newSelectedTags);
    setFormData(prev => ({
      ...prev,
      tags: newSelectedTags.map(tag => tag.id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (feature) {
        // Update existing feature
        const { success, error } = await updateFeature(feature.id, formData);
        
        if (error) {
          throw new Error(error.message);
        }
        
        toast.success("Feature updated successfully");
        router.push(`/roadmaps/${roadmapId}`);
        router.refresh();
      } else {
        // Create new feature
        const { data, error } = await createFeature(roadmapId, formData);
        
        if (error) {
          throw new Error(error.message);
        }
        
        toast.success("Feature created successfully");
        router.push(`/roadmaps/${roadmapId}`);
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save feature");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            placeholder="Feature title"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Describe this feature..."
            value={formData.description}
            onChange={handleChange}
            rows={4}
            disabled={isLoading}
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status_id || ""}
            onValueChange={value => handleSelectChange("status_id", value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(status => (
                <SelectItem key={status.id} value={status.id}>
                  <div className="flex items-center">
                    <div
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="assignee">Assignee</Label>
          <Select
            value={formData.assignee_id || "unassigned"}
            onValueChange={value => handleSelectChange("assignee_id", value === "unassigned" ? null : value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Assign to someone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.display_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !formData.start_date && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.start_date
                    ? format(new Date(formData.start_date), "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.start_date ? new Date(formData.start_date) : undefined}
                  onSelect={date => handleDateChange("start_date", date)}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !formData.due_date && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date
                    ? format(new Date(formData.due_date), "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.due_date ? new Date(formData.due_date) : undefined}
                  onSelect={date => handleDateChange("due_date", date)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label>Tags</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal"
                disabled={isLoading}
              >
                Select Tags
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search tags..." />
                <CommandList>
                  <CommandEmpty>No tags found.</CommandEmpty>
                  <CommandGroup>
                    {tags.map(tag => (
                      <CommandItem
                        key={tag.id}
                        onSelect={() => addTag(tag)}
                      >
                        <div
                          className="h-3 w-3 rounded-full mr-2"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTags.map(tag => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="flex items-center gap-1"
                  style={{ backgroundColor: tag.color, color: "#fff" }}
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => removeTag(tag.id)}
                    className="rounded-full p-0.5 hover:bg-black/20"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove</span>
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : feature ? "Update Feature" : "Create Feature"}
        </Button>
      </div>
    </form>
  );
} 