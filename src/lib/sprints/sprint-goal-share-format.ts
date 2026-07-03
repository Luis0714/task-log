export type SprintGoalShareFormat = "image" | "pdf";

export const SPRINT_GOAL_SHARE_FORMAT_ITEMS = [
  { value: "image" as const, label: "Imagen" },
  { value: "pdf" as const, label: "PDF" },
];

export function getSprintGoalShareMimeType(format: SprintGoalShareFormat): string {
  return format === "pdf" ? "application/pdf" : "image/png";
}

export function getSprintGoalShareFileExtension(format: SprintGoalShareFormat): string {
  return format === "pdf" ? "pdf" : "png";
}
