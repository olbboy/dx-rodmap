"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoadmap, updateRoadmap } from "@/lib/actions/roadmap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface RoadmapFormProps {
  roadmap?: {
    id: string;
    title: string;
    description: string | null;
    is_public: boolean;
  };
}

export function RoadmapForm({ roadmap }: RoadmapFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: roadmap?.title || "",
    description: roadmap?.description || "",
    is_public: roadmap?.is_public || false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_public: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (roadmap) {
        // Update existing roadmap
        const { data, error } = await updateRoadmap(roadmap.id, formData);
        
        if (error) {
          throw new Error(error.message);
        }
        
        toast.success("Roadmap updated successfully");
        router.push(`/roadmaps/${roadmap.id}`);
      } else {
        // Create new roadmap
        const { data, error } = await createRoadmap(formData);
        
        if (error) {
          throw new Error(error.message);
        }
        
        toast.success("Roadmap created successfully");
        router.push(`/roadmaps/${data.id}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save roadmap");
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
            placeholder="My Project Roadmap"
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
            placeholder="Describe the purpose of this roadmap..."
            value={formData.description}
            onChange={handleChange}
            rows={4}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="is_public"
            checked={formData.is_public}
            onCheckedChange={handleSwitchChange}
            disabled={isLoading}
          />
          <Label htmlFor="is_public">Make this roadmap public</Label>
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
          {isLoading ? "Saving..." : roadmap ? "Update Roadmap" : "Create Roadmap"}
        </Button>
      </div>
    </form>
  );
} 