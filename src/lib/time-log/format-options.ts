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

const sprintDateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatSprintDateRange(
  startDate?: string,
  finishDate?: string,
): string | null {
  if (!startDate && !finishDate) return null;

  if (startDate && finishDate) {
    return `${sprintDateFormatter.format(new Date(startDate))} – ${sprintDateFormatter.format(new Date(finishDate))}`;
  }

  const singleDate = startDate ?? finishDate;
  return singleDate ? sprintDateFormatter.format(new Date(singleDate)) : null;
}

export function getSprintTimeFrameLabel(
  timeFrame?: "past" | "current" | "future",
): string | null {
  switch (timeFrame) {
    case "current":
      return "Actual";
    case "future":
      return "Futuro";
    case "past":
      return "Pasado";
    default:
      return null;
  }
}
