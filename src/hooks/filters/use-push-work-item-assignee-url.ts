"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";

import { buildAdoContextQuery } from "@/lib/ado/parse-context-search-params";

export type PushWorkItemAssigneeUrlContext = {
  project: string;
  team: string;
  sprint: string;
  sprintDay?: string;
};

export function usePushWorkItemAssigneeUrl() {
  const router = useRouter();
  const pathname = usePathname();

  const pushAssignee = useCallback(
    (assignee: string, context: PushWorkItemAssigneeUrlContext) => {
      router.push(
        `${pathname}${buildAdoContextQuery({
          project: context.project,
          team: context.team,
          sprint: context.sprint,
          sprintDay: context.sprintDay,
          assignee,
        })}`,
        { scroll: false },
      );
    },
    [pathname, router],
  );

  return { pushAssignee };
}
