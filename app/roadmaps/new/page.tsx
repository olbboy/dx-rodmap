import { Metadata } from "next";
import { RoadmapForm } from "@/components/roadmap/roadmap-form";

export const metadata: Metadata = {
  title: "Create Roadmap",
  description: "Create a new roadmap for your project",
};

export default function NewRoadmapPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Create Roadmap</h1>
        <p className="text-muted-foreground">
          Create a new roadmap to plan and track your project features and goals.
        </p>
      </div>
      <div className="grid gap-6">
        <div className="rounded-lg border bg-card p-6">
          <RoadmapForm />
        </div>
      </div>
    </div>
  );
} 