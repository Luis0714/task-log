"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { mergeAdoContextIntoSearchParams } from "@/lib/ado/parse-context-search-params";

export type PushWorkItemAssigneeUrlContext = {
  project: string;
  team: string;
  sprint: string;
  sprintDay?: string;
};

export function usePushWorkItemAssigneeUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pushAssignee = useCallback(
    (assignee: string, context: PushWorkItemAssigneeUrlContext) => {
      // Mergemos sobre los search params actuales para preservar flags que
      // no son del contexto ADO (p. ej. `modo=multiple`), en lugar de
      // reconstruir la URL desde cero y perderlos.
      const current = new URLSearchParams(searchParams.toString());
      const query = mergeAdoContextIntoSearchParams(current, {
        project: context.project,
        team: context.team,
        sprint: context.sprint,
        sprintDay: context.sprintDay,
        assignee,
      });
      router.push(`${pathname}${query}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { pushAssignee };
}
