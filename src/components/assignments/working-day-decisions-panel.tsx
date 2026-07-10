"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarOff, CheckCircle2, ChevronDown, ListChecks, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  buildRangeDays,
  summarizeRangeDays,
  type RangeDay,
} from "@/lib/working-days/range";
import type { ColombianHoliday } from "@/lib/holidays/co";
import {
  fetchColombianHolidays,
  type WorkingDayDecisionDto,
} from "@/services/assignments/working-day-decisions.service";

export type WorkingDayDecisionsPanelProps = Readonly<{
  fromIso: string;
  toIso: string;
  decisions: WorkingDayDecisionDto[];
  onDecisionsChange: (next: WorkingDayDecisionDto[]) => void;
}>;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function WorkingDayDecisionsPanel({
  fromIso,
  toIso,
  decisions,
  onDecisionsChange,
}: WorkingDayDecisionsPanelProps) {
  const [holidays, setHolidays] = useState<ColombianHoliday[]>([]);
  const [holidayState, setHolidayState] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [holidayError, setHolidayError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [observationDraft, setObservationDraft] = useState("");

  const validRange =
    ISO_DATE_RE.test(fromIso) && ISO_DATE_RE.test(toIso) && toIso >= fromIso;

  useEffect(() => {
    if (!validRange) return;
    let cancelled = false;
    setHolidayState("loading");
    setHolidayError(null);
    const years = new Set<number>();
    years.add(Number(fromIso.slice(0, 4)));
    years.add(Number(toIso.slice(0, 4)));
    Promise.all(Array.from(years).map((y) => fetchColombianHolidays(y)))
      .then((chunks) => {
        if (cancelled) return;
        const map = new Map<string, string>();
        for (const chunk of chunks) {
          for (const h of chunk) map.set(h.date, h.name);
        }
        const next = Array.from(map.entries())
          .map(([date, name]) => ({ date, name }))
          .filter((h) => h.date >= fromIso && h.date <= toIso)
          .sort((a, b) => a.date.localeCompare(b.date));
        setHolidays(next);
        setHolidayState("idle");
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setHolidayState("error");
        setHolidayError(
          cause instanceof Error
            ? cause.message
            : "No pudimos cargar los festivos de Colombia.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [fromIso, toIso, validRange]);

  const days: RangeDay[] = useMemo(() => {
    if (!validRange) return [];
    return buildRangeDays({
      fromIso,
      toIso,
      holidays,
      overrides: decisions,
    });
  }, [validRange, fromIso, toIso, holidays, decisions]);

  const nonWorking = useMemo(
    () =>
      days
        .filter((d) => !d.isWorking)
        .map((d) => {
          const override = decisions.find((dv) => dv.date === d.date) ?? null;
          return { ...d, override };
        }),
    [days, decisions],
  );

  const summary = useMemo(() => summarizeRangeDays(days), [days]);

  function upsertDecision(next: WorkingDayDecisionDto) {
    const idx = decisions.findIndex((d) => d.date === next.date);
    if (idx >= 0) {
      const copy = [...decisions];
      copy[idx] = next;
      onDecisionsChange(copy);
    } else {
      onDecisionsChange([...decisions, next]);
    }
  }

  function applyOverride(date: string) {
    upsertDecision({
      date,
      decision: "habil_con_observacion",
      observation:
        editingDate === date && observationDraft
          ? observationDraft
          : "Se laboró este día por motivo no hábiles.",
    });
    setEditingDate(null);
    setObservationDraft("");
  }

  function clearOverride(date: string) {
    onDecisionsChange(decisions.filter((d) => d.date !== date));
    if (editingDate === date) {
      setEditingDate(null);
      setObservationDraft("");
    }
  }

  if (!validRange) {
    return (
      <p className="text-muted-foreground text-xs">
        Define una fecha de inicio y fin para revisar los días no hábiles detectados.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          {holidayState === "loading" ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" aria-hidden />
              Cargando festivos…
            </span>
          ) : (
            <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <ListChecks className="size-3.5" aria-hidden />
                {summary.working} hábiles
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
                <CalendarOff className="size-3.5" aria-hidden />
                {summary.notWorking} no hábiles
              </span>
              {summary.overrides > 0 ? (
                <span className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-300">
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  {summary.overrides} con justificación
                </span>
              ) : null}
            </span>
          )}
        </p>
        {nonWorking.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Ocultar" : "Ver detalle"}
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform",
                expanded && "rotate-180",
              )}
              aria-hidden
            />
          </Button>
        ) : null}
      </div>

      {holidayState === "error" && holidayError ? (
        <p className="text-destructive inline-flex items-center gap-1 text-xs">
          <AlertCircle className="size-3" aria-hidden />
          {holidayError}
        </p>
      ) : null}

      {expanded && nonWorking.length > 0 ? (
        <div className="max-h-72 overflow-y-auto rounded-lg border bg-muted/20 p-2">
          <ul className="flex flex-col gap-1.5">
            {nonWorking.map((day) => {
              const editing = editingDate === day.date;
              return (
                <li
                  key={day.date}
                  className="flex flex-col gap-1 rounded-md border bg-background px-2 py-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs">
                      <span className="font-mono">{day.date}</span>
                      <Badge variant="secondary" className="border-transparent">
                        {formatReason(day.holidayName, day.reason)}
                      </Badge>
                    </span>
                    {day.override ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => clearOverride(day.date)}
                      >
                        Quitar justificación
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setEditingDate(day.date);
                          setObservationDraft("");
                        }}
                      >
                        Marcar como hábil
                      </Button>
                    )}
                  </div>
                  {editing ? (
                    <div className="flex flex-col gap-1">
                      <Input
                        placeholder="¿Por qué se labora este día? (requerido)"
                        value={observationDraft}
                        onChange={(e) => setObservationDraft(e.target.value)}
                      />
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingDate(null);
                            setObservationDraft("");
                          }}
                          className="text-muted-foreground"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={observationDraft.trim() === ""}
                          onClick={() => applyOverride(day.date)}
                        >
                          Aplicar
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  {day.override?.observation ? (
                    <p className="text-muted-foreground bg-muted/40 rounded px-2 py-1 text-xs italic">
                      “{day.override.observation}”
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function formatReason(
  holidayName: string | null,
  reason: string,
): string {
  if (reason === "holiday") return `Festivo: ${holidayName ?? "—"}`;
  if (reason === "weekend") return "Fin de semana";
  if (reason === "decision_overridden_working") return "Justificado como hábil";
  if (reason === "decision_overridden_off") return "Justificado como no hábil";
  return "Día hábil";
}
