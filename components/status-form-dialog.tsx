"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStatus, updateStatus } from "@/lib/actions/status";
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
import { Status } from "@/types";

interface StatusFormDialogProps {
  roadmapId: string;
  status?: Status;
  children: React.ReactNode;
}

export function StatusFormDialog({
  roadmapId,
  status,
  children,
}: StatusFormDialogProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(status?.name || "");
  const [color, setColor] = useState(status?.color || "#4299e1");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (status) {
        // Update existing status
        const { success, error } = await updateStatus(status.id, {
          name,
          color,
        });

        if (error) {
          throw new Error(error.message);
        }

        toast.success("Status updated successfully");
      } else {
        // Create new status
        const { data, error } = await createStatus(roadmapId, {
          name,
          color,
        });

        if (error) {
          throw new Error(error.message);
        }

        toast.success("Status created successfully");
      }

      setIsOpen(false);
      // Add a small delay to ensure the database operation completes
      setTimeout(() => {
        router.refresh();
      }, 500);
    } catch (error: any) {
      toast.error(error.message || "Failed to save status");
    } finally {
      setIsLoading(false);
    }
  };

  // Predefined color options
  const colorOptions = [
    "#4299e1", // blue
    "#48bb78", // green
    "#ed8936", // orange
    "#9f7aea", // purple
    "#f56565", // red
    "#ecc94b", // yellow
    "#667eea", // indigo
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {status ? "Edit Status" : "Create Status"}
            </DialogTitle>
            <DialogDescription>
              {status
                ? "Update status details for your roadmap."
                : "Add a new status to track feature progress."}
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
                  placeholder="#4299e1"
                  required
                  pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                  title="Valid hex color code (e.g., #4299e1)"
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
                ? status
                  ? "Updating..."
                  : "Creating..."
                : status
                ? "Update"
                : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 