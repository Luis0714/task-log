const shareDateFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const shareDateTimeFormatter = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatSprintGoalShareDate(date: Date): string {
  return shareDateFormatter.format(date);
}

export function formatSprintGoalShareDateTime(date: Date): string {
  return shareDateTimeFormatter.format(date);
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
  generatedAt: Date,
): string {
  const datePart = generatedAt.toISOString().slice(0, 10);
  return `${sanitizeSprintGoalShareFilename(sprintName)}-${datePart}.png`;
}
