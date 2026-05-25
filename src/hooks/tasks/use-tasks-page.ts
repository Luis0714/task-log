"use client";

import {
  useSprintItemsPage,
  type UseSprintItemsPageOptions,
} from "@/hooks/sprint-items/use-sprint-items-page";

export type UseTasksPageOptions = Omit<UseSprintItemsPageOptions, "kind">;

export function useTasksPage(options: UseTasksPageOptions) {
  const page = useSprintItemsPage({ ...options, kind: "tasks" });
  return { ...page, tasks: page.items };
}
