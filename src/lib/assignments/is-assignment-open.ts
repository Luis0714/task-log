import type { PersonProjectAssignmentRow } from "@/lib/db";

export function isAssignmentOpen(
  row: Pick<PersonProjectAssignmentRow, "validTo">,
  on: Date = new Date(),
): boolean {
  if (!row.validTo) return true;
  return row.validTo.getTime() >= startOfDay(on).getTime();
}

export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setUTCHours(0, 0, 0, 0);
  return c;
}

export function endOfDay(d: Date): Date {
  const c = new Date(d);
  c.setUTCHours(23, 59, 59, 999);
  return c;
}
