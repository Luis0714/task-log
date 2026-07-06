"use client";

import { useMemo, useState } from "react";
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
import { MultiCheckboxFilter } from "@/components/filters/multi-checkbox-filter";
import { ReportsTimeLogExportRangeBanner } from "@/components/reports/time-log/reports-time-log-export-range-banner";
import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";
import type { SprintTimesWeekColumn } from "@/lib/sprints/sprint-stats-types";
import { formatSprintOptionLabel } from "@/lib/time-log/format-options";

type ExportScope = "sprint" | "week";

const SCOPE_ITEMS = [
  { value: "sprint" as const, label: "Sprint completo" },
  { value: "week" as const, label: "Semana específica" },
];

export type ReportsTimeLogExportDialogProps = {
  project: string;
  team: string;
  availableSprints: AdoSprintDto[];
  /** Semanas del sprint activo (usadas solo si se exporta ese mismo sprint). */
  activeSprintWeeks?: readonly SprintTimesWeekColumn[];
  initialSprintPath?: string;
  hiddenAssignees?: readonly string[];
  disabled?: boolean;
};

export function ReportsTimeLogExportDialog({
  project,
  team,
  availableSprints,
  activeSprintWeeks,
  initialSprintPath,
  hiddenAssignees = [],
  disabled = false,
}: Readonly<ReportsTimeLogExportDialogProps>) {
  const [open, setOpen] = useState(false);
  const [selectedPaths, setSelectedPaths] = useState<string[]>(() => {
    if (initialSprintPath && availableSprints.some((s) => s.path === initialSprintPath)) {
      return [initialSprintPath];
    }
    return availableSprints[0] ? [availableSprints[0].path] : [];
  });
  const [scope, setScope] = useState<ExportScope>("sprint");
  const [selectedWeekLabel, setSelectedWeekLabel] = useState<string>(
    () => activeSprintWeeks?.[0]?.label ?? "",
  );
  const [generating, setGenerating] = useState(false);

  // Helper para resolver info de sprint por path.
  const sprintByPath = useMemo(() => {
    const map = new Map<string, AdoSprintDto>();
    for (const sprint of availableSprints) {
      map.set(sprint.path, sprint);
    }
    return map;
  }, [availableSprints]);

  const selectedSprints = useMemo(
    () =>
      selectedPaths
        .map((path) => sprintByPath.get(path))
        .filter((sprint): sprint is AdoSprintDto => Boolean(sprint)),
    [selectedPaths, sprintByPath],
  );

  // Una sola etiqueta para el popover; al ser >=2 sprints el banner expone el rango.
  const triggerLabel =
    selectedSprints.length === 0
      ? "Selecciona sprints"
      : selectedSprints.length === 1
        ? formatSprintOptionLabel(selectedSprints[0])
        : `${selectedSprints.length} sprints seleccionados`;

  // El alcance "Semana específica" sólo aplica al sprint activo (para el que
  // conocemos `activeSprintWeeks`). Si la selección cambia, mostramos sólo el
  // sprint completo.
  const isSingleActiveSprint =
    selectedSprints.length === 1 &&
    initialSprintPath !== undefined &&
    selectedPaths[0] === initialSprintPath;
  const showWeekScope = isSingleActiveSprint;

  // Rango cubierto por los sprints: por fecha de inicio más temprana y de
  // finalización más tardía (orden estable ISO de `YYYY-MM-DD`).
  const rangeInfo = useMemo(() => {
    if (selectedSprints.length < 2) return null;

    const sortedByStart = [...selectedSprints].sort((a, b) =>
      (a.startDate ?? "").localeCompare(b.startDate ?? ""),
    );
    const sortedByFinish = [...selectedSprints].sort((a, b) =>
      (a.finishDate ?? "").localeCompare(b.finishDate ?? ""),
    );

    const startSprint = sortedByStart[0];
    const endSprint = sortedByFinish[sortedByFinish.length - 1];
    if (!startSprint?.startDate || !endSprint?.finishDate) return null;

    return {
      startIso: startSprint.startDate,
      startName: startSprint.name,
      endIso: endSprint.finishDate,
      endName: endSprint.name,
    };
  }, [selectedSprints]);

  async function handleGenerate() {
    if (selectedSprints.length === 0) return;
    setGenerating(true);

    const sprintsParam = selectedSprints
      .map((s) => {
        const start = s.startDate ?? "";
        const end = s.finishDate ?? "";
        return `${s.path}|${s.name}|${start}|${end}`;
      })
      .join(",");

    const params = new URLSearchParams({
      project,
      team,
      sprints: sprintsParam,
    });

    if (
      isSingleActiveSprint &&
      scope === "week" &&
      activeSprintWeeks &&
      activeSprintWeeks.length > 0
    ) {
      // La semana sólo aplica al flujo single-sprint (mantiene compatibilidad
      // con la API legacy).
      const weekIndex = activeSprintWeeks.findIndex(
        (w) => w.label === selectedWeekLabel,
      );
      params.set("weekIndex", String(weekIndex >= 0 ? weekIndex : 0));
    }

    if (hiddenAssignees.length > 0) {
      params.set("hiddenAssignees", hiddenAssignees.join(","));
    }

    try {
      const res = await fetch(`/api/reports/times/excel?${params}`);

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "No se pudo generar el reporte.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const filename =
        selectedSprints.length === 1
          ? `reporte-tiempos-${selectedSprints[0].name}.xlsx`
          : `reporte-tiempos-${selectedSprints.length}-sprints.xlsx`;
      a.href = url;
      a.download = filename;
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

  const sprintOptions = useMemo(
    () =>
      availableSprints.map((sprint) => ({
        value: sprint.path,
        label: formatSprintOptionLabel(sprint),
      })),
    [availableSprints],
  );

  const hasWeeks = isSingleActiveSprint && (activeSprintWeeks?.length ?? 0) > 0;

  const canGenerate = selectedSprints.length > 0 && !generating;

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
          <MultiCheckboxFilter
            id="export-sprints"
            label="Sprints a exportar"
            options={sprintOptions}
            selected={selectedPaths}
            onSelectedChange={setSelectedPaths}
            triggerLabel={triggerLabel}
            presets={[
              {
                label: "Todos",
                active: selectedPaths.length === availableSprints.length,
                onSelect: () =>
                  setSelectedPaths(availableSprints.map((s) => s.path)),
              },
            ]}
            disabled={availableSprints.length === 0}
          />

          {rangeInfo ? (
            <ReportsTimeLogExportRangeBanner
              startIso={rangeInfo.startIso}
              startSprintName={rangeInfo.startName}
              endIso={rangeInfo.endIso}
              endSprintName={rangeInfo.endName}
            />
          ) : null}

          {showWeekScope ? (
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
          ) : null}

          {showWeekScope && scope === "week" ? (
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="week-select"
                className="text-xs text-muted-foreground uppercase tracking-wide"
              >
                Semana
              </Label>
              {hasWeeks ? (
                <Select
                  value={selectedWeekLabel}
                  onValueChange={(v) => setSelectedWeekLabel(v ?? "")}
                >
                  <SelectTrigger id="week-select" className="w-full">
                    <span className="min-w-0 flex-1 truncate text-left text-sm">
                      {activeSprintWeeks?.find(
                        (w) => w.label === selectedWeekLabel,
                      )?.label ?? "Seleccionar semana"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {activeSprintWeeks?.map((week, i) => (
                      <SelectItem key={i} value={week.label}>
                        {week.label}
                        {week.dateRangeLabel
                          ? ` · ${week.dateRangeLabel}`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No hay semanas disponibles para este sprint.
                </p>
              )}
            </div>
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
          <Button onClick={() => void handleGenerate()} disabled={!canGenerate}>
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
