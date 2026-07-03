import type { AdoTaskStateDto } from "@/lib/schemas/ado-catalog";

const COMPLETED_NAME_HINTS = ["done", "closed", "resolved", "completado", "hecho", "cerrado"];

/** Detecta estado Done/Closed por nombre (sin metadatos de categoría ADO). */
export function isDoneTaskStateName(stateName: string): boolean {
  const normalized = stateName.trim().toLowerCase();
  return COMPLETED_NAME_HINTS.some((hint) => normalized.includes(hint));
}

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
  return isDoneTaskStateName(stateName);
}

export function pickDefaultOpenTaskState(
  states: AdoTaskStateDto[],
  overrideName?: string | null,
): string {
  if (overrideName && states.some((state) => state.name === overrideName)) return overrideName;
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

export function pickDefaultCompletedTaskState(
  states: AdoTaskStateDto[],
  overrideName?: string | null,
): string {
  if (overrideName && states.some((state) => state.name === overrideName)) return overrideName;
  const env = readEnvOverride("AZDO_TASK_DONE_STATE");
  if (env && states.some((state) => state.name === env)) return env;

  const completedStates = states.filter((state) => state.category === "Completed");
  if (completedStates.length === 0) return states[states.length - 1]?.name ?? "";

  for (const hint of COMPLETED_NAME_HINTS) {
    const match = completedStates.find((state) => state.name.toLowerCase().includes(hint));
    if (match) return match.name;
  }

  return completedStates[0]?.name ?? "";
}

export function resolveTargetTaskState(
  states: AdoTaskStateDto[],
  requestedState: string,
): AdoTaskStateDto | null {
  const normalized = requestedState.trim();
  const exact = states.find((state) => state.name === normalized);
  if (exact) return exact;

  if (normalized && isCompletedTaskState(states, normalized)) {
    const completedName = pickDefaultCompletedTaskState(states);
    return states.find((state) => state.name === completedName) ?? null;
  }

  const openName = pickDefaultOpenTaskState(states);
  return states.find((state) => state.name === openName) ?? states[0] ?? null;
}

export function resolveTaskStateSelection(
  states: AdoTaskStateDto[],
  current: string,
): string {
  if (current && states.some((state) => state.name === current)) return current;
  return pickDefaultOpenTaskState(states);
}
