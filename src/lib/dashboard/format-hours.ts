export function formatHours(value: number, unit = "h"): string {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${formatted}${unit}`;
}
