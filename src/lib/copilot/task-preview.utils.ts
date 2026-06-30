import type { CreateTaskBatchItem } from "@/lib/schemas/agent";
import { getTodayDateKey } from "@/lib/time-log/working-date-default";

export function groupTasksByPbi(tasks: CreateTaskBatchItem[]): Map<number, CreateTaskBatchItem[]> {
  return tasks.reduce((map, task) => {
    const group = map.get(task.pbiId) ?? [];
    group.push(task);
    return map.set(task.pbiId, group);
  }, new Map<number, CreateTaskBatchItem[]>());
}

export function buildEmptyTask(sprintPath: string, team: string): CreateTaskBatchItem {
  return {
    pbiId: 0,
    pbiTitle: "",
    title: "",
    hours: 1,
    description: "",
    activity: "",
    workingDate: getTodayDateKey(),
    workingTime: "09:00",
    state: "Closed",
    markAsDone: true,
    sprintPath,
    team,
  };
}

export function isValidTask(task: CreateTaskBatchItem): boolean {
  return (
    task.pbiId > 0 &&
    task.title.trim().length > 0 &&
    task.description.trim().length > 0 &&
    task.hours > 0 &&
    task.hours <= 24 &&
    /^\d{4}-\d{2}-\d{2}$/.test(task.workingDate) &&
    /^\d{2}:\d{2}$/.test(task.workingTime) &&
    task.state.trim().length > 0
  );
}
