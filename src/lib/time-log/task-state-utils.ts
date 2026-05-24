import type { AdoTaskStateDto } from "@/lib/schemas/ado-catalog";

const COMPLETED_NAME_HINTS = ["done", "closed", "resolved", "completado", "hecho", "cerrado"];

function readEnvOverride(key: "AZDO_TASK_DONE_STATE" | "AZDO_TASK_TODO_STATE"): string | null {
  const value = process.env[key]?.trim();
  return value || null;
}

export function isCompletedTaskStateCategory(category: string): boolean {
  return category === "Completed";
}

export function isCompletedTaskState(states: AdoTaskStateDto[], stateName: string): boolean {
  const match = states.find((state) => state.name === stateName);
  if (match) return isCompletedTaskStateCategory(match.category);
  const normalized = stateName.trim().toLowerCase();
  return COMPLETED_NAME_HINTS.some((hint) => normalized.includes(hint));
}

export function pickDefaultOpenTaskState(states: AdoTaskStateDto[]): string {
  const env = readEnvOverride("AZDO_TASK_TODO_STATE");
  if (env && states.some((state) => state.name === env)) return env;

  const proposed = states.find((state) => state.category === "Proposed");
  if (proposed) return proposed.name;

  const inProgress = states.find((state) => state.category === "InProgress");
  if (inProgress) return inProgress.name;

  const nameHints = ["to do", "new", "proposed", "por hacer"];
  for (const hint of nameHints) {
    const match = states.find((state) => state.name.toLowerCase().includes(hint));
    if (match) return match.name;
  }

  return states[0]?.name ?? "";
}

export function pickDefaultCompletedTaskState(states: AdoTaskStateDto[]): string {
  const env = readEnvOverride("AZDO_TASK_DONE_STATE");
  if (env && states.some((state) => state.name === env)) return env;

  const completed = states.find((state) => state.category === "Completed");
  if (completed) return completed.name;

  for (const hint of COMPLETED_NAME_HINTS) {
    const match = states.find((state) => state.name.toLowerCase().includes(hint));
    if (match) return match.name;
  }

  return states[states.length - 1]?.name ?? "";
}

export function resolveTaskStateSelection(
  states: AdoTaskStateDto[],
  current: string,
): string {
  if (current && states.some((state) => state.name === current)) return current;
  return pickDefaultCompletedTaskState(states);
}
