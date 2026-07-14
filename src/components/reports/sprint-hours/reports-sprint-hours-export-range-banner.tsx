"use client";

import { CalendarRange } from "lucide-react";

import { cn } from "@/lib/utils";

const FULL_DATE_FORMATTER = new Intl.DateTimeFormat("es", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim().slice(0, 10));
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return FULL_DATE_FORMATTER.format(date);
}

export type ReportsSprintHoursExportRangeBannerProps = {
  startIso: string | null | undefined;
  startSprintName: string;
  endIso: string | null | undefined;
  endSprintName: string;
  className?: string;
};

export function ReportsSprintHoursExportRangeBanner({
  startIso,
  startSprintName,
  endIso,
  endSprintName,
  className,
}: Readonly<ReportsSprintHoursExportRangeBannerProps>) {
  const startDate = formatDate(startIso);
  const endDate = formatDate(endIso);
  if (!startDate || !endDate) return null;

  return (
    <output
      className={cn(
        "flex items-start gap-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <CalendarRange className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
      <p className="leading-relaxed">
        Contendra los reportes de tiempos hechos desde el{" "}
        <span className="font-medium text-foreground">{startDate}</span>, día en
        que empezó{" "}
        <span className="font-medium text-foreground">“{startSprintName}”</span>
        , hasta el{" "}
        <span className="font-medium text-foreground">{endDate}</span>, día en
        que finaliza{" "}
        <span className="font-medium text-foreground">“{endSprintName}”</span>.
      </p>
    </output>
  );
}
