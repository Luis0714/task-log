"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

import {
  readAssigneeFromSearchParams,
  resolveAssigneeForUi,
} from "@/lib/filters/assignee-url";

export function useAssigneeFilterFromUrl(
  localAssignee: string,
  setLocalAssignee: (value: string) => void,
) {
  const searchParams = useSearchParams();

  const assigneeFromUrl = useMemo(
    () => readAssigneeFromSearchParams(searchParams),
    [searchParams],
  );

  useEffect(() => {
    if (assigneeFromUrl !== localAssignee) {
      setLocalAssignee(assigneeFromUrl);
    }
  }, [assigneeFromUrl, localAssignee, setLocalAssignee]);

  const assigneeForUi = useMemo(
    () => resolveAssigneeForUi(assigneeFromUrl, localAssignee),
    [assigneeFromUrl, localAssignee],
  );

  return { assigneeFromUrl, assigneeForUi };
}
