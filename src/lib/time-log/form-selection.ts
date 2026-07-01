import type { UseFormReturn } from "react-hook-form";

import type { AdoProjectDto, AdoSprintDto, AdoTeamDto } from "@/lib/schemas/ado-catalog";
import type { TimeLogFormValues } from "@/lib/schemas/time-log";

export function resetSprintSelection(form: UseFormReturn<TimeLogFormValues>) {
  form.setValue("sprintPath", "");
  form.setValue("pbiId", "");
  form.clearErrors(["sprintPath", "pbiId"]);
}

export function resetTeamSelection(form: UseFormReturn<TimeLogFormValues>) {
  form.setValue("team", "");
  resetSprintSelection(form);
  form.clearErrors("team");
}

export function resetPbiSelection(form: UseFormReturn<TimeLogFormValues>) {
  form.setValue("pbiId", "");
  form.clearErrors("pbiId");
}

export function resetTaskStepFields(form: UseFormReturn<TimeLogFormValues>) {
  const noValidate = { shouldValidate: false };
  form.setValue("taskTitle", "", noValidate);
  form.setValue("hours", "", noValidate);
  form.setValue("description", "", noValidate);
  form.clearErrors([
    "taskTitle",
    "hours",
    "description",
    "activity",
    "workingDate",
    "workingTime",
    "taskState",
  ]);
}

export function resolvePreferredProject(
  projects: AdoProjectDto[],
  defaultProject: string | null,
): string | null {
  if (defaultProject && projects.some((item) => item.name === defaultProject)) {
    return defaultProject;
  }
  return projects[0]?.name ?? null;
}

export function resolvePreferredTeam(
  teams: AdoTeamDto[],
  defaultTeam: string | null,
  suggestedTeam: string | null,
): string | null {
  if (defaultTeam && teams.some((item) => item.name === defaultTeam)) {
    return defaultTeam;
  }
  if (suggestedTeam && teams.some((item) => item.name === suggestedTeam)) {
    return suggestedTeam;
  }
  return teams[0]?.name ?? null;
}

export function resolvePreferredSprint(sprints: AdoSprintDto[]): string | null {
  const preferred = sprints.find((sprint) => sprint.timeFrame === "current") ?? sprints[0];
  return preferred?.path ?? null;
}
