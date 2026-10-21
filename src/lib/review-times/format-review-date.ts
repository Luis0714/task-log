function meridiem(dayPeriod: string): string {
  const normalized = dayPeriod.toLowerCase().replaceAll(".", "").replaceAll(" ", "");
  return normalized.startsWith("p") ? "PM" : "AM";
}

export function formatReviewDate(iso: string | null, timeZone: string): string {
  if (!iso) return "";
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return "";

  const parts = new Intl.DateTimeFormat("es-CO", {
    timeZone,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h12",
  }).formatToParts(instant);

  return parts
    .map((part) => {
      if (part.type === "hour") return part.value.padStart(2, "0");
      if (part.type === "dayPeriod") return meridiem(part.value);
      if (part.type === "literal") return part.value.replaceAll("\u202f", " ").replaceAll("\u00a0", " ");
      return part.value;
    })
    .join("");
}
