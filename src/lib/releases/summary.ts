import type { ReleaseListItem } from "@/lib/releases/types";

export function isLastStageReady(item: ReleaseListItem): boolean {
  const pendingStages = item.stages.filter((stage) => stage.status === "needs_approval");
  const lastStage = item.stages.at(-1);
  return pendingStages.length === 1 && pendingStages[0]?.id === lastStage?.id;
}

export function releaseSummary(item: ReleaseListItem): string {
  if (isLastStageReady(item)) {
    const lastStage = item.stages.at(-1);
    if (lastStage) return `${lastStage.shortName} listo`;
  }
  if (item.pendingCount === 1) return "1 acción pendiente";
  if (item.pendingCount > 1) return `${item.pendingCount} acciones pendientes`;

  const lastSucceeded = [...item.stages]
    .reverse()
    .find((stage) => stage.status === "succeeded");
  if (lastSucceeded) return `${lastSucceeded.shortName} listo`;
  return "Sin despliegues";
}

export function matchesReleaseSearch(item: ReleaseListItem, search: string): boolean {
  const query = search.trim().toLowerCase();
  if (!query) return true;
  const haystack = [
    item.name,
    item.createdBy,
    item.branch,
    item.definitionName,
    ...item.stages.map((stage) => stage.name),
    ...item.stages.map((stage) => stage.shortName),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}
