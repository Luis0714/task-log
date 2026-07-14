import {
  isFullSprintTimesShareVariant,
  parseSprintTimesShareWeekIndex,
  type SprintTimesShareVariant,
} from "@/lib/sprints/sprint-times-share-variant";
import { sanitizeSprintGoalShareFilename } from "@/lib/sprints/format-sprint-goal-share";
import { toLocalDateKey } from "@/lib/working-days";

function resolveVariantFilenamePart(variant: SprintTimesShareVariant): string {
  if (isFullSprintTimesShareVariant(variant)) return "completo";
  const weekIndex = parseSprintTimesShareWeekIndex(variant);
  return weekIndex === null ? variant : `semana-${weekIndex}`;
}

export function buildSprintTimesShareDownloadFilename(
  sprintName: string,
  variant: SprintTimesShareVariant,
  generatedAt: Date = new Date(),
): string {
  const datePart = toLocalDateKey(generatedAt);
  const sprintPart = sanitizeSprintGoalShareFilename(sprintName);
  const variantPart = resolveVariantFilenamePart(variant);
  return `${sprintPart}-tiempos-${variantPart}-${datePart}.png`;
}
