"use client";

import type { ReactNode } from "react";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { TimeGreeting } from "@/components/greeting/time-greeting";
import { PageHeader } from "@/components/layout/page-header";
import { resolveCatalogError } from "@/lib/ado/resolve-catalog-error";
import { PAGE_SEO } from "@/lib/seo/pages";
import type { TimeLogServerBaseline } from "@/lib/time-log/load-time-log-baseline";

export type TimeLogPageShellProps = {
  serverBaseline: TimeLogServerBaseline;
  greetingName?: string;
  timeZone?: string;
  children?: ReactNode;
};

export function TimeLogPageShell({
  serverBaseline,
  greetingName = "",
  timeZone,
  children = null,
}: Readonly<TimeLogPageShellProps>) {
  const { catalog } = serverBaseline;

  const catalogError = resolveCatalogError(catalog);

  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <p className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
        <TimeGreeting name={greetingName} timeZone={timeZone} />
      </p>
      <PageHeader
        title={PAGE_SEO.timeLog.title}
        description={PAGE_SEO.timeLog.description}
      />

      {catalogError ? <CopilotErrorAlert message={catalogError} /> : null}

      {children}
    </div>
  );
}
