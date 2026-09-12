import type { LinkableWorkItemKind } from "@/lib/work-items/linkable-work-item";

export function mapWorkItemKind(type: string): LinkableWorkItemKind {
  const raw = type.trim().toLowerCase();
  if (raw.includes("bug")) return "bug";
  if (raw.includes("task") || raw.includes("tarea")) return "task";
  return "pbi";
}
