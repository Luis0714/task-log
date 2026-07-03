"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";

type ExportScope = "sprint" | "week";

const SCOPE_ITEMS = [
  { value: "sprint" as const, label: "Sprint completo" },
  { value: "week" as const, label: "Semana específica" },
];

export type ReportsTimeLogExportDialogProps = {
  project: string;
  team: string;
  sprint: AdoSprintDto;
  times: SprintTimesMetrics;
  hiddenAssignees?: readonly string[];
  disabled?: boolean;
};

export function ReportsTimeLogExportDialog({
  project,
  team,
  sprint,
  times,
  hiddenAssignees = [],
  disabled = false,
}: ReportsTimeLogExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<ExportScope>("sprint");
  const [selectedWeekLabel, setSelectedWeekLabel] = useState(times.weeks[0]?.label ?? "");
  const [generating, setGenerating] = useState(false);

  const hasWeeks = times.weeks.length > 0;
  const weekIndex = times.weeks.findIndex((w) => w.label === selectedWeekLabel);
  const selectedWeek = times.weeks[weekIndex];
  const weekDisplayLabel = selectedWeek
    ? `${selectedWeek.label}${selectedWeek.dateRangeLabel ? ` · ${selectedWeek.dateRangeLabel}` : ""}`
    : "Seleccionar semana";

  async function handleGenerate() {
    setGenerating(true);

    const params = new URLSearchParams({
      project,
      team,
      sprintPath: sprint.path,
      sprintName: sprint.name,
    });

    if (sprint.startDate) params.set("sprintStartDate", sprint.startDate);
    if (sprint.finishDate) params.set("sprintFinishDate", sprint.finishDate);
    if (scope === "week") params.set("weekIndex", String(weekIndex >= 0 ? weekIndex : 0));
    if (hiddenAssignees.length > 0) {
      params.set("hiddenAssignees", hiddenAssignees.join(","));
    }

    try {
      const res = await fetch(`/api/reports/times/excel?${params}`);

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error ?? "No se pudo generar el reporte.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-tiempos-${sprint.name}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setOpen(false);
    } catch {
      toast.error("Error al generar el reporte. Intenta de nuevo.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
          >
            <Download className="size-4" aria-hidden />
            Exportar reporte
          </Button>
        }
      />

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar reporte de tiempos</DialogTitle>
          <DialogDescription>
            Configura el reporte y descárgalo como archivo Excel profesional listo para compartir.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Sprint
            </Label>
            <p className="text-sm font-medium">{sprint.name}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Alcance
            </Label>
            <SegmentedControl
              items={SCOPE_ITEMS}
              value={scope}
              onValueChange={setScope}
              ariaLabel="Alcance del reporte"
              fullWidth
            />
          </div>

          {scope === "week" && hasWeeks ? (
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="week-select"
                className="text-xs text-muted-foreground uppercase tracking-wide"
              >
                Semana
              </Label>
              <Select
                value={selectedWeekLabel}
                onValueChange={(v) => setSelectedWeekLabel(v ?? "")}
              >
                <SelectTrigger id="week-select" className="w-full">
                  <span className="min-w-0 flex-1 truncate text-left text-sm">
                    {weekDisplayLabel}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {times.weeks.map((week, i) => (
                    <SelectItem key={i} value={week.label}>
                      {week.label}
                      {week.dateRangeLabel ? ` · ${week.dateRangeLabel}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {scope === "week" && !hasWeeks ? (
            <p className="text-muted-foreground text-sm">
              No hay semanas disponibles para este sprint.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={generating}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void handleGenerate()}
            disabled={generating || (scope === "week" && !hasWeeks)}
          >
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Generando...
              </>
            ) : (
              <>
                <Download className="size-4" aria-hidden />
                Generar reporte
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
