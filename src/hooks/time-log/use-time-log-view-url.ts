"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  DEFAULT_TIME_LOG_VIEW,
  parseTimeLogViewParam,
  timeLogViewToParam,
  type TimeLogViewId,
} from "@/lib/time-log/time-log-view";

export function useTimeLogViewUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const view =
    parseTimeLogViewParam(searchParams.get("modo")) ?? DEFAULT_TIME_LOG_VIEW;

  const setView = useCallback(
    (nextView: TimeLogViewId) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextView === DEFAULT_TIME_LOG_VIEW) {
        params.delete("modo");
      } else {
        params.set("modo", timeLogViewToParam(nextView));
      }

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  return { view, setView };
}
