"use client";

import { useEffect, useState } from "react";

import { fetchLinkableWorkItems } from "@/services/work-items/linkable-work-items.service";
import type { LinkableWorkItemDto } from "@/lib/work-items/linkable-work-item";

export type UseLinkableWorkItemsInput = {
  project: string | null | undefined;
  team: string | null | undefined;
  includeBacklog?: boolean;
};

export type UseLinkableWorkItemsResult = {
  items: LinkableWorkItemDto[];
  loading: boolean;
  error: string | null;
};

type WorkItemsSnapshot = {
  key: string;
  items: LinkableWorkItemDto[];
  error: string | null;
};

export function useLinkableWorkItems({
  project,
  team,
  includeBacklog = false,
}: UseLinkableWorkItemsInput): UseLinkableWorkItemsResult {
  const projectName = project?.trim() ?? "";
  const teamName = team?.trim() ?? "";
  const enabled = Boolean(projectName && teamName);
  const requestKey = `${projectName}|${teamName}|${includeBacklog}`;

  const [snapshot, setSnapshot] = useState<WorkItemsSnapshot>({
    key: "",
    items: [],
    error: null,
  });

  useEffect(() => {
    if (!enabled) return;

    const controller = new AbortController();

    void fetchLinkableWorkItems(
      { project: projectName, team: teamName, includeBacklog },
      controller.signal,
    ).then((result) => {
      if (controller.signal.aborted) return;

      if (result.ok) {
        setSnapshot({ key: requestKey, items: result.items, error: null });
        return;
      }

      setSnapshot({ key: requestKey, items: [], error: result.error });
    });

    return () => controller.abort();
  }, [enabled, includeBacklog, projectName, requestKey, teamName]);

  if (!enabled) {
    return { items: [], loading: false, error: null };
  }

  const loading = snapshot.key !== requestKey;
  return {
    items: snapshot.items,
    loading,
    error: loading ? null : snapshot.error,
  };
}
