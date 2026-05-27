function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function isWithinDays(isoDate: string, days: number): boolean {
  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) return false;
  const targetDay = startOfDay(target);
  const todayStart = startOfDay(new Date());
  const span = (days - 1) * 24 * 60 * 60 * 1000;
  return targetDay >= todayStart - span && targetDay <= todayStart;
}

export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString();
}
