"use client";

import { useCallback, useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReportsTimeLogExportPeriodInput } from "@/components/reports/time-log/reports-time-log-export-period-input";
import { ReportsTimeLogExportProjectsFilter } from "@/components/reports/time-log/reports-time-log-export-projects-filter";
import { ReportsTimeLogExportTeamsFilter } from "@/components/reports/time-log/reports-time-log-export-teams-filter";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type {
  HoursReportExcelQuerySchema,
  HoursReportPeriodSchema,
} from "@/lib/schemas/reports-hours";

export type ReportsTimeLogExportDialogProps = {
  catalog: AdoCatalogSnapshot;
  initialScopes: { projectIds: string[]; teamIds: string[] };
  initialPeriod: HoursReportPeriodSchema;
  onDownload: (query: HoursReportExcelQuerySchema) => Promise<void>;
  disabled?: boolean;
};

export function ReportsTimeLogExportDialog({
  catalog,
  initialScopes,
  initialPeriod,
  onDownload,
  disabled = false,
}: Readonly<ReportsTimeLogExportDialogProps>) {
  const [open, setOpen] = useState(false);
  const [projectIds, setProjectIds] = useState<string[]>(initialScopes.projectIds);
  const [teamIds, setTeamIds] = useState<string[]>(initialScopes.teamIds);
  const [period, setPeriod] = useState<HoursReportPeriodSchema>(initialPeriod);
  const [generating, setGenerating] = useState(false);

  const onGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const query: HoursReportExcelQuerySchema = {
        periodKind: period.kind,
        monthKey: period.kind === "month" ? period.monthKey : undefined,
        fromIso: period.kind === "range" ? period.fromIso : undefined,
        toIso: period.kind === "range" ? period.toIso : undefined,
        projectIds,
        teamIds,
      };
      await onDownload(query);
      setOpen(false);
    } finally {
      setGenerating(false);
    }
  }, [period, projectIds, teamIds, onDownload]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm" disabled={disabled}>
            <Download className="size-4" aria-hidden />
            Exportar reporte
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Exportar reporte de horas</DialogTitle>
          <DialogDescription>
            Configura el reporte y descárgalo como archivo Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <ReportsTimeLogExportPeriodInput
            periodKind={period.kind}
            year={Number(period.kind === "month" ? period.monthKey.slice(0, 4) : new Date().getUTCFullYear())}
            monthKey={period.kind === "month" ? period.monthKey : `${new Date().getUTCFullYear()}-01`}
            rangeFrom={period.kind === "range" ? period.fromIso : ""}
            rangeTo={period.kind === "range" ? period.toIso : ""}
            onPeriodKindChange={(kind) =>
              setPeriod(
                kind === "month"
                  ? { kind: "month", monthKey: `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}` }
                  : { kind: "range", fromIso: "", toIso: "" },
              )
            }
            onMonthKeyChange={(key) => setPeriod({ kind: "month", monthKey: key })}
            onRangeFromChange={(iso) =>
              setPeriod((prev) => (prev.kind === "range" ? { kind: "range", fromIso: iso, toIso: prev.toIso } : prev))
            }
            onRangeToChange={(iso) =>
              setPeriod((prev) => (prev.kind === "range" ? { kind: "range", fromIso: prev.fromIso, toIso: iso } : prev))
            }
          />

          <ReportsTimeLogExportProjectsFilter
            projects={catalog.projects}
            selected={projectIds}
            onChange={setProjectIds}
          />
          <ReportsTimeLogExportTeamsFilter
            teams={catalog.teams}
            selected={teamIds}
            onChange={setTeamIds}
          />

          <p className="text-muted-foreground -mt-1 text-xs">
            Resumen: {projectIds.length || "Todos"} proyectos · {teamIds.length || "Todos"} equipos · {period.kind === "month" ? `Mes ${period.monthKey}` : `${period.fromIso} → ${period.toIso}`}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={generating}>
            Cancelar
          </Button>
          <Button onClick={() => void onGenerate()} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Generando...
              </>
            ) : (
              <>
                <Download className="size-4" aria-hidden />
                Generar Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}