"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export type ReviewTimesProjectOption = {
  id: string;
  name: string;
};

export function ReviewTimesProjectField({
  project,
  projects,
  onProjectChange,
}: Readonly<{
  project: string;
  projects: readonly ReviewTimesProjectOption[];
  onProjectChange: (project: string) => void;
}>) {
  return (
    <div className="flex min-w-48 flex-1 flex-col gap-1.5">
      <Label>Proyecto</Label>
      <Select
        value={project}
        disabled={projects.length === 0}
        onValueChange={(next) => next && onProjectChange(next)}
      >
        <SelectTrigger>
          <span className="truncate">{project}</span>
        </SelectTrigger>
        <SelectContent>
          {projects.map((item) => (
            <SelectItem key={item.id} value={item.name}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
