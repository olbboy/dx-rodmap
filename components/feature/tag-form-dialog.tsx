"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTag, updateTag } from "@/lib/actions/tag";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tag } from "@/types";

interface TagFormDialogProps {
  roadmapId: string;
  tag?: Tag;
  children: React.ReactNode;
}

export function TagFormDialog({
  roadmapId,
  tag,
  children,
}: TagFormDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(tag?.name || "");
  const [color, setColor] = useState(tag?.color || "#10b981");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (tag) {
        // Update existing tag
        const { success, error } = await updateTag(tag.id, {
          name,
          color,
        });

        if (error) {
          throw new Error(error.message);
        }

        toast.success("Tag updated successfully");
      } else {
        // Create new tag
        const { data, error } = await createTag(roadmapId, {
          name,
          color,
        });

        if (error) {
          throw new Error(error.message);
        }

        toast.success("Tag created successfully");
      }

      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save tag");
    } finally {
      setIsLoading(false);
    }
  };

  // Predefined color options
  const colorOptions = [
    "#10b981", // green
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#f43f5e", // red
    "#f59e0b", // amber
    "#6366f1", // indigo
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {tag ? "Edit Tag" : "Create Tag"}
            </DialogTitle>
            <DialogDescription>
              {tag
                ? "Update tag details for your roadmap."
                : "Add a new tag to categorize your features."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Color
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-8 p-1"
                  required
                  disabled={isLoading}
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#10b981"
                  required
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  title="Valid hex color code (e.g., #10b981)"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Presets</Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {colorOptions.map((colorOption) => (
                  <button
                    key={colorOption}
                    type="button"
                    onClick={() => setColor(colorOption)}
                    className="w-6 h-6 rounded-full border border-gray-300 shadow-sm"
                    style={{ backgroundColor: colorOption }}
                    title={colorOption}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? tag
                  ? "Updating..."
                  : "Creating..."
                : tag
                ? "Update"
                : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 