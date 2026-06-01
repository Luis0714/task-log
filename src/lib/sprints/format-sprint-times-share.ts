import type { SprintTimesShareVariant } from "@/lib/sprints/sprint-times-share-variant";
import { sanitizeSprintGoalShareFilename } from "@/lib/sprints/format-sprint-goal-share";

function resolveVariantFilenamePart(variant: SprintTimesShareVariant): string {
  if (variant === "week1") return "semana-1";
  if (variant === "week2") return "semana-2";
  return "completo";
}

export function buildSprintTimesShareDownloadFilename(
  sprintName: string,
  variant: SprintTimesShareVariant,
  generatedAt: Date = new Date(),
): string {
  const datePart = generatedAt.toISOString().slice(0, 10);
  const sprintPart = sanitizeSprintGoalShareFilename(sprintName);
  const variantPart = resolveVariantFilenamePart(variant);
  return `${sprintPart}-tiempos-${variantPart}-${datePart}.png`;
}
