"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

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

  const lastAssigneeFromUrlRef = useRef(assigneeFromUrl);

  useEffect(() => {
    // Solo sincroniza cuando realmente cambia la URL; evita pisar
    // selección local optimista mientras router.push está en curso.
    if (lastAssigneeFromUrlRef.current === assigneeFromUrl) return;
    lastAssigneeFromUrlRef.current = assigneeFromUrl;
    if (assigneeFromUrl !== localAssignee) setLocalAssignee(assigneeFromUrl);
  }, [assigneeFromUrl, localAssignee, setLocalAssignee]);

  const assigneeForUi = useMemo(
    () => resolveAssigneeForUi(assigneeFromUrl, localAssignee),
    [assigneeFromUrl, localAssignee],
  );

  return { assigneeFromUrl, assigneeForUi };
}
