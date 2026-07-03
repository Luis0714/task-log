import type { CreateTasksResponse } from "@/lib/copilot/copilot.service";

export function buildTasksSuccessSummary(
  results: CreateTasksResponse["results"],
  totalHours: number,
): string {
  const successCount = results?.filter((r) => r.ok).length ?? 0;
  const failureCount = results?.filter((r) => !r.ok).length ?? 0;
  if (failureCount === 0) {
    return `Listo. Creé ${successCount} task${successCount === 1 ? "" : "s"} con ${totalHours}h en total — todas marcadas como Done.`;
  }
  return `Creé ${successCount} de ${successCount + failureCount} tasks (${failureCount} fallaron).`;
}

export function buildLogWorkSuccessSummary(items: { hours: number; workItemId: number }[]): string {
  if (items.length === 1) {
    return `Registré ${items[0]!.hours}h en el elemento #${items[0]!.workItemId}.`;
  }
  const total = items.reduce((s, i) => s + i.hours, 0);
  return `Registré ${items.length} elementos con ${total}h en total.`;
}

export function totalHours(items: { hours: number }[]): number {
  return items.reduce((s, i) => s + i.hours, 0);
}
