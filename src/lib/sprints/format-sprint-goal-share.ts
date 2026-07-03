import type { SprintGoalShareFormat } from "@/lib/sprints/sprint-goal-share-format";
import { getSprintGoalShareFileExtension } from "@/lib/sprints/sprint-goal-share-format";

const shareDateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const shareDateTimeFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatSprintGoalShareDate(date: Date): string {
  return shareDateFormatter.format(date);
}

export function formatSprintGoalShareDateTime(date: Date): string {
  return shareDateTimeFormatter.format(date);
}

export function truncateSprintGoalShareText(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

export function sanitizeSprintGoalShareFilename(value: string): string {
  const sanitized = value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();

  return sanitized || "objetivo-sprint";
}

export function buildSprintGoalShareDownloadFilename(
  sprintName: string,
  format: SprintGoalShareFormat,
  generatedAt: Date = new Date(),
): string {
  const datePart = generatedAt.toISOString().slice(0, 10);
  const extension = getSprintGoalShareFileExtension(format);
  return `${sanitizeSprintGoalShareFilename(sprintName)}-${datePart}.${extension}`;
}
