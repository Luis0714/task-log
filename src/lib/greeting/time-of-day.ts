const PLACEHOLDER_NAMES = new Set(["hola", "usuario"]);

function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/).find(Boolean) ?? "";
}

export function hourInTimeZone(date: Date, timeZone: string): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
  })
    .formatToParts(date)
    .find((part) => part.type === "hour")?.value;

  const parsed = Number(hour ?? "0");
  return parsed === 24 ? 0 : parsed;
}

/** 05:00–11:59 días, 12:00–18:59 tardes, 19:00–04:59 noches. */
export function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function formatTimeGreeting(displayName: string, date: Date, timeZone: string): string {
  const greeting = greetingForHour(hourInTimeZone(date, timeZone));
  const name = firstName(displayName);
  if (!name || PLACEHOLDER_NAMES.has(name.toLowerCase())) return `${greeting}!`;
  return `${greeting}, ${name}!`;
}
