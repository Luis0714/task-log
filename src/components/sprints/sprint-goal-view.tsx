"use client";

import { useState } from "react";

import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export type SprintGoalViewProps = {
  sprintName: string;
};

export function SprintGoalView({ sprintName }: SprintGoalViewProps) {
  const [goal, setGoal] = useState("");

  return (
    <DashboardSection
      title="Objetivo del sprint"
      description={`Define o revisa el objetivo de ${sprintName}.`}
    >
      <div className="flex max-w-2xl flex-col gap-3">
        <Textarea
          value={goal}
          placeholder="Describe el objetivo principal de este sprint..."
          rows={6}
          onChange={(event) => setGoal(event.target.value)}
        />
        <div className="flex justify-end">
          <Button type="button" disabled={!goal.trim()}>
            Guardar objetivo
          </Button>
        </div>
      </div>
    </DashboardSection>
  );
}
