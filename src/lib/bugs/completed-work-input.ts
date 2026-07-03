export function formatInitialCompletedWork(hours: number | undefined): string {
  if (hours === undefined || !Number.isFinite(hours)) return "0";
  return String(hours);
}

export function parseCompletedWorkInput(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}
