"use client";

import { Loader2 } from "lucide-react";

import { PeriodModePicker } from "@/components/news-stories/period-mode-picker";
import type { DateFilterMode } from "@/components/news-stories/news-stories-reported-format";

export type ReportedSectionHeaderProps = Readonly<{
  mode: DateFilterMode;
  onModeChange: (next: DateFilterMode) => void;
  pickerDisabled: boolean;
  loading: boolean;
  subtitle: string;
}>;

/**
 * Encabezado de la sección "Novedades reportadas":
 * título (con loader inline al lado) + subtítulo + segmented de periodo
 * alineado a la derecha en lg+.
 */
export function ReportedSectionHeader({
  mode,
  onModeChange,
  pickerDisabled,
  loading,
  subtitle,
}: ReportedSectionHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-2">
          <h2
            id="reported-news-heading"
            className="text-base font-semibold"
          >
            Novedades reportadas
          </h2>
          {loading ? (
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
              <Loader2 className="size-3 animate-spin" aria-hidden />
              <span aria-live="polite">Cargando…</span>
            </span>
          ) : null}
        </div>
        <PeriodModePicker
          mode={mode}
          onChange={onModeChange}
          disabled={pickerDisabled}
        />
      </div>
      <p className="text-muted-foreground text-xs">{subtitle}</p>
    </header>
  );
}
