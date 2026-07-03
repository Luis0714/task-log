"use client";

import { useSearchParams } from "next/navigation";

import { TimeLogFormSkeleton } from "@/components/skeletons/time-log-form-skeleton";
import { TimeLogShellSkeleton } from "@/components/skeletons/time-log-shell-skeleton";
import { TimeLogPageLayout } from "@/components/time-log/time-log-page-layout";
import {
  DEFAULT_TIME_LOG_VIEW,
  parseTimeLogViewParam,
} from "@/lib/time-log/time-log-view";

export default function TimeLogLoading() {
  // Leemos `?modo=…` para que el skeleton refleje el layout del destino
  // cuando la URL ya lo trae (p. ej. aterrizaje directo en `/time-log?modo=multiple`).
  const searchParams = useSearchParams();
  const view =
    parseTimeLogViewParam(searchParams.get("modo")) ?? DEFAULT_TIME_LOG_VIEW;

  return (
    <TimeLogPageLayout>
      <TimeLogShellSkeleton />
      <TimeLogFormSkeleton view={view} />
    </TimeLogPageLayout>
  );
}