export function formatWorkItemOptionLabel(item: {
  id: number;
  title: string;
  state?: string;
}): string {
  const stateSuffix = item.state ? ` · ${item.state}` : "";
  return `#${item.id} — ${item.title}${stateSuffix}`;
}

export function formatSprintOptionLabel(sprint: {
  name: string;
  timeFrame?: "past" | "current" | "future";
}): string {
  if (sprint.timeFrame === "current") return `${sprint.name} (actual)`;
  return sprint.name;
}
