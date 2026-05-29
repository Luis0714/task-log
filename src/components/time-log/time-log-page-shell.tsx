"use client";

import type { ReactNode } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { PageHeader } from "@/components/layout/page-header";
import { PAGE_SEO } from "@/lib/seo/pages";
import type { TimeLogServerBaseline } from "@/lib/time-log/load-time-log-baseline";

export type TimeLogPageShellProps = {
  serverBaseline: TimeLogServerBaseline;
  children?: ReactNode;
};

export function TimeLogPageShell({
  serverBaseline,
  children = null,
}: TimeLogPageShellProps) {
  const { catalog } = serverBaseline;

  const catalogError =
    catalog.errors.projects ??
    catalog.errors.teams ??
    catalog.errors.sprints ??
    null;

  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <PageHeader
        title={PAGE_SEO.timeLog.title}
        description={PAGE_SEO.timeLog.description}
      />

      {catalogError ? <CopilotErrorAlert message={catalogError} /> : null}

      {children}
    </div>
  );
}
