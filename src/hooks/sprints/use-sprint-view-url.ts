"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  DEFAULT_SPRINT_VIEW,
  parseSprintViewParam,
  sprintViewToParam,
  type SprintViewId,
} from "@/lib/sprints/sprint-view";

export function useSprintViewUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const view = parseSprintViewParam(searchParams.get("vista")) ?? DEFAULT_SPRINT_VIEW;

  const setView = useCallback(
    (nextView: SprintViewId) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextView === DEFAULT_SPRINT_VIEW) {
        params.delete("vista");
      } else {
        params.set("vista", sprintViewToParam(nextView));
      }

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  return { view, setView };
}
