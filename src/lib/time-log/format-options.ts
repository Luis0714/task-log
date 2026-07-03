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

function parseDateForDisplay(iso: string): Date | null {
  const key = iso.trim().slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function formatSprintDateRange(
  startDate?: string,
  finishDate?: string,
): string | null {
  if (!startDate && !finishDate) return null;

  if (startDate && finishDate) {
    const start = parseDateForDisplay(startDate);
    const end = parseDateForDisplay(finishDate);
    if (!start || !end) return null;
    return `${sprintDateFormatter.format(start)} – ${sprintDateFormatter.format(end)}`;
  }

  const singleIso = startDate ?? finishDate;
  if (!singleIso) return null;
  const date = parseDateForDisplay(singleIso);
  return date ? sprintDateFormatter.format(date) : null;
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
