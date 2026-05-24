export function formatWorkItemOptionLabel(item: { id: number; title: string }): string {
  return `#${item.id} — ${item.title}`;
}

export function formatSprintOptionLabel(sprint: {
  name: string;
  timeFrame?: "past" | "current" | "future";
}): string {
  if (sprint.timeFrame === "current") return `${sprint.name} (actual)`;
  return sprint.name;
}
