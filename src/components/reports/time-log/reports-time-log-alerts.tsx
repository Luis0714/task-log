import { AlertTriangle, Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { HoursReportAlert } from "@/lib/reports/hours/hours-report-types";

const TITLES: Record<HoursReportAlert["kind"], string> = {
  news_not_configured: "Novedades sin configurar",
  news_story_deleted: "HU de novedad eliminada",
  incomplete_work_item: "Tarea con datos incompletos",
  unconfigured_person: "Persona sin asignación aplicable",
};

export type ReportsTimeLogAlertsProps = {
  alerts: readonly HoursReportAlert[];
};

export function ReportsTimeLogAlerts({ alerts }: Readonly<ReportsTimeLogAlertsProps>) {
  if (alerts.length === 0) return null;
  return (
    <div className="space-y-2">
      {alerts.map((alert, idx) => {
        const Icon = alert.kind === "incomplete_work_item" ? Info : AlertTriangle;
        return (
          <Alert key={`${alert.kind}-${idx}`} variant="default">
            <Icon className="size-4" aria-hidden />
            <AlertTitle>{TITLES[alert.kind]}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}