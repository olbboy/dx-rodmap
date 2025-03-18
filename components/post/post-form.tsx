"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost, PostFormData } from "@/lib/actions/post";
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
import { Post, Status, User } from "@/types";

interface PostFormProps {
  roadmapId: string;
  postId?: string;
  statuses: Status[];
  users: User[];
  initialValues?: PostFormData;
}

export function PostForm({
  roadmapId,
  postId,
  statuses,
  users,
  initialValues,
}: PostFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialValues?.tags || []);
  const [formData, setFormData] = useState<PostFormData>(
    initialValues || {
      title: "",
      description: "",
      status_id: statuses.length > 0 ? statuses[0].id : "",
      assignee_id: "",
      start_date: "",
      end_date: "",
      eta: "",
      priority: undefined,
      progress: 0,
      tags: [],
    }
  );

  // Load initially selected tags when editing
  useEffect(() => {
    if (initialValues?.tags) {
      setSelectedTags(initialValues.tags);
      setFormData(prev => ({
        ...prev,
        tags: initialValues.tags
      }));
    }
  }, [initialValues]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | null) => {
    if (name === "assignee_id" && value === "unassigned") {
      setFormData(prev => ({ ...prev, [name]: undefined }));
    } else if (name === "priority" && value === "none") {
      setFormData(prev => ({ ...prev, [name]: undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      const newSelectedTags = [...selectedTags, tag];
      setSelectedTags(newSelectedTags);
      setFormData(prev => ({
        ...prev,
        tags: newSelectedTags,
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newSelectedTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newSelectedTags);
    setFormData(prev => ({
      ...prev,
      tags: newSelectedTags,
    }));
  };

  const handleProgressChange = (value: string) => {
    const progress = parseInt(value, 10);
    if (!isNaN(progress) && progress >= 0 && progress <= 100) {
      setFormData(prev => ({
        ...prev,
        progress,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Include tags from the state
      const dataWithTags = {
        ...formData,
        tags: selectedTags,
      };

      if (postId) {
        // Update existing post
        const { success, error } = await updatePost(postId, dataWithTags);
        
        if (error) {
          throw new Error(error.message);
        }
        
        toast.success("Post updated successfully");
        router.push(`/roadmaps/${roadmapId}/posts/${postId}`);
      } else {
        // Create new post
        const { data, error } = await createPost(roadmapId, dataWithTags);
        
        if (error) {
          throw new Error(error.message);
        }
        
        toast.success("Post created successfully");
        
        if (data) {
          router.push(`/roadmaps/${roadmapId}/posts/${data.id}`);
        } else {
          router.push(`/roadmaps/${roadmapId}`);
        }
      }
      
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-base">Title</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter post title"
            required
            disabled={isLoading}
            className="mt-1.5"
          />
        </div>
        
        <div>
          <Label htmlFor="description" className="text-base">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter post description"
            disabled={isLoading}
            className="mt-1.5 min-h-32"
          />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="status" className="text-base">Status</Label>
            <Select
              value={formData.status_id}
              onValueChange={(value) => handleSelectChange("status_id", value)}
              disabled={isLoading}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem 
                    key={status.id} 
                    value={status.id}
                    className="flex items-center gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      {status.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="assignee" className="text-base">Assignee</Label>
            <Select
              value={formData.assignee_id || ""}
              onValueChange={(value) => handleSelectChange("assignee_id", value || null)}
              disabled={isLoading}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  <span className="text-muted-foreground">Unassigned</span>
                </SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.display_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-base">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "mt-1.5 w-full justify-start text-left font-normal",
                    !formData.start_date && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.start_date ? (
                    format(new Date(formData.start_date), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.start_date ? new Date(formData.start_date) : undefined}
                  onSelect={(date) => handleDateChange("start_date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Label className="text-base">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "mt-1.5 w-full justify-start text-left font-normal",
                    !formData.end_date && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.end_date ? (
                    format(new Date(formData.end_date), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.end_date ? new Date(formData.end_date) : undefined}
                  onSelect={(date) => handleDateChange("end_date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Label className="text-base">Estimated Completion Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "mt-1.5 w-full justify-start text-left font-normal",
                    !formData.eta && "text-muted-foreground"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.eta ? (
                    format(new Date(formData.eta), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.eta ? new Date(formData.eta) : undefined}
                  onSelect={(date) => handleDateChange("eta", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div>
            <Label className="text-base">Priority</Label>
            <Select
              value={formData.priority || ""}
              onValueChange={(value) => handleSelectChange("priority", value || null)}
              disabled={isLoading}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">None</span>
                </SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="progress" className="text-base">Progress</Label>
            <div className="flex items-center gap-4 mt-1.5">
              <Input
                id="progress"
                type="range"
                min="0"
                max="100"
                value={formData.progress || 0}
                onChange={(e) => handleProgressChange(e.target.value)}
                className="flex-1"
                disabled={isLoading}
              />
              <span className="w-10 text-center">{formData.progress || 0}%</span>
            </div>
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start text-left font-normal"
                  disabled={isLoading}
                >
                  Add Tags
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search or create tag..." />
                  <CommandList>
                    <CommandEmpty>
                      Press enter to create tag
                      <Button 
                        variant="ghost" 
                        className="mt-2 w-full"
                        onClick={() => {
                          const input = document.querySelector('.cm-input') as HTMLInputElement;
                          if (input && input.value) {
                            addTag(input.value);
                            input.value = '';
                          }
                        }}
                      >
                        Create Tag
                      </Button>
                    </CommandEmpty>
                    <CommandGroup>
                      {["Bug", "Feature", "Enhancement", "Documentation", "UI", "Backend", "Frontend", "API"].map(tag => (
                        <CommandItem
                          key={tag}
                          onSelect={() => addTag(tag)}
                        >
                          {tag}
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
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="rounded-full p-0.5 hover:bg-secondary"
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
          {isLoading ? "Saving..." : postId ? "Update Post" : "Create Post"}
        </Button>
      </div>
    </form>
  );
} 