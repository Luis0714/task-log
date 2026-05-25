"use client";

import {
  useSprintItemsPage,
  type UseSprintItemsPageOptions,
} from "@/hooks/sprint-items/use-sprint-items-page";

export type UseBugsPageOptions = Omit<UseSprintItemsPageOptions, "kind">;

export function useBugsPage(options: UseBugsPageOptions) {
  const page = useSprintItemsPage({ ...options, kind: "bugs" });
  return { ...page, bugs: page.items };
}
