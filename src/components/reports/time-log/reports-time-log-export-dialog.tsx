"use client";

import { useCallback, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { appToast } from "@/lib/toast";

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
import { triggerBlobDownload } from "@/lib/sprints/trigger-blob-download";
import type { SprintTimesWeekColumn } from "@/lib/sprints/sprint-stats-types";
import { formatSprintOptionLabel } from "@/lib/time-log/format-options";

type ExportScope = "sprint" | "week";

const SCOPE_ITEMS = [
  { value: "sprint" as const, label: "Sprint completo" },
  { value: "week" as const, label: "Semana específica" },
];

const MAX_EXPORT_SPRINTS = 2;

/**
 * Construye un índice path → posición del sprint dentro del catálogo (que
 * viene ordenado de mayor a menor). Pura y testeable sin DOM.
 */
function buildSprintPathIndex(
  sprints: readonly AdoSprintDto[],
): Map<string, number> {
  return new Map(sprints.map((sprint, index) => [sprint.path, index]));
}

/**
 * Devuelve `true` si dos sprints son **consecutivos** en el catálogo, es
 * decir, sus posiciones en `sprintIndex` difieren exactamente en 1.
 */
function areSprintsAdjacent(
  pathA: string,
  pathB: string,
  sprintIndex: ReadonlyMap<string, number>,
): boolean {
  const idxA = sprintIndex.get(pathA);
  const idxB = sprintIndex.get(pathB);
  if (idxA === undefined || idxB === undefined) return false;
  return Math.abs(idxA - idxB) === 1;
}

/**
 * Etiqueta del popover del multi-select según la selección actual.
 * Pura, testeable sin React.
 */
function resolveTriggerLabel(sprints: readonly AdoSprintDto[]): string {
  if (sprints.length === 0) return "Selecciona sprints";
  if (sprints.length === 1) return formatSprintOptionLabel(sprints[0]);
  return `${sprints.length} sprints seleccionados`;
}

/**
 * Devuelve `true` sólo si el usuario tiene seleccionado **exactamente** el
 * sprint activo del catálogo (del que conocemos `activeSprintWeeks`). Es la
 * condición que habilita el selector "Semana específica".
 */
function isSingleActiveSprint(
  sprints: readonly AdoSprintDto[],
  initialSprintPath: string | undefined,
  firstSelectedPath: string | undefined,
): boolean {
  if (sprints.length !== 1) return false;
  if (initialSprintPath === undefined) return false;
  return firstSelectedPath === initialSprintPath;
}

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

  // Mapa path → índice en el catálogo (ordenado de mayor a menor). Permite
  // detectar "consecutividad" en O(1) sin escanear la lista en cada cambio.
  const sprintPathIndex = useMemo(
    () => buildSprintPathIndex(availableSprints),
    [availableSprints],
  );

  /**
   * Cambia la selección aplicando tres reglas:
   * 1. Reducir (des-marcar) siempre se permite.
   * 2. Si el usuario pasa del cap, se notifica y se trunca.
   * 3. Con exactamente `MAX_EXPORT_SPRINTS` elegidos, los dos deben ser
   *    **consecutivos** en el catálogo (índices adyacentes).
   */
  const handleSelectedSprintsChange = useCallback(
    (next: string[]) => {
      if (next.length < selectedPaths.length) {
        setSelectedPaths(next);
        return;
      }
      if (next.length > MAX_EXPORT_SPRINTS) {
        appToast.error(
          `Solo puedes escoger hasta ${MAX_EXPORT_SPRINTS} sprints por reporte.`,
        );
        setSelectedPaths(next.slice(0, MAX_EXPORT_SPRINTS));
        return;
      }
      if (
        next.length === MAX_EXPORT_SPRINTS &&
        !areSprintsAdjacent(next[0], next[1], sprintPathIndex)
      ) {
        appToast.error(
          "Solo puedes escoger dos sprints consecutivos del catálogo.",
        );
        return;
      }
      setSelectedPaths(next);
    },
    [selectedPaths, sprintPathIndex],
  );

  // Marca como deshabilitadas las opciones NO seleccionadas que NO son
  // adyacentes a la selección actual. Las ya seleccionadas siempre se pueden
  // des-marcar.
  const isSprintOptionDisabled = useCallback(
    (path: string) => {
      if (selectedPaths.includes(path)) return false;
      if (selectedPaths.length === 0) return false;
      if (selectedPaths.length >= MAX_EXPORT_SPRINTS) return true;
      return !areSprintsAdjacent(path, selectedPaths[0], sprintPathIndex);
    },
    [selectedPaths, sprintPathIndex],
  );

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
  const triggerLabel = resolveTriggerLabel(selectedSprints);

  // El alcance "Semana específica" sólo aplica al sprint activo (para el que
  // conocemos `activeSprintWeeks`). Si la selección cambia, mostramos sólo el
  // sprint completo.
  const showWeekScope = isSingleActiveSprint(
    selectedSprints,
    initialSprintPath,
    selectedPaths[0],
  );

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
      showWeekScope &&
      scope === "week" &&
      activeSprintWeeks &&
      activeSprintWeeks.length > 0
    ) {
      // La semana sólo aplica al flujo single-sprint (mantiene compatibilidad
      // con la API legacy).
      const weekIndex = activeSprintWeeks.findIndex(
        (w) => w.label === selectedWeekLabel,
      );
      params.set("weekIndex", String(Math.max(0, weekIndex)));
    }

    if (hiddenAssignees.length > 0) {
      params.set("hiddenAssignees", hiddenAssignees.join(","));
    }

    try {
      const res = await fetch(`/api/reports/times/excel?${params}`);

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        appToast.error(data.error ?? "No se pudo generar el reporte.");
        return;
      }

      const blob = await res.blob();
      const filename =
        selectedSprints.length === 1
          ? `reporte-tiempos-${selectedSprints[0].name}.xlsx`
          : `reporte-tiempos-${selectedSprints.length}-sprints.xlsx`;
      triggerBlobDownload(blob, filename);
      setOpen(false);
    } catch {
      appToast.error("Error al generar el reporte. Intenta de nuevo.");
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

  const hasWeeks = showWeekScope && (activeSprintWeeks?.length ?? 0) > 0;

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
            onSelectedChange={handleSelectedSprintsChange}
            triggerLabel={triggerLabel}
            isOptionDisabled={isSprintOptionDisabled}
            disabled={availableSprints.length === 0}
          />

          <p className="text-muted-foreground -mt-3 text-xs">
            Puedes escoger hasta {MAX_EXPORT_SPRINTS} sprints consecutivos del catálogo.
          </p>

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
