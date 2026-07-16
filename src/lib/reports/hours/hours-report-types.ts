import type { DeviationLevel } from "@/lib/reports/hours/deviation";

/** Nivel del semáforo de cumplimiento (D9). */
export type SemaforoLevel = "verde" | "amarillo" | "rojo";

/**
 * Etiqueta de la columna "% Asignación": una excepción vigente (con su %
 * ponderado), el 100% por defecto inferido, o "sin configurar" cuando la
 * persona reportó horas sin asignación aplicable.
 */
export type AssignmentPctLabel =
  | { readonly kind: "exception"; readonly weightedPct: number }
  | { readonly kind: "default" }
  | { readonly kind: "unconfigured" };

/** Una fila del reporte: combinación (usuario, proyecto, equipo). */
export type HoursReportRow = Readonly<{
  projectId: string;
  projectName: string;
  teamId: string | null;
  teamName: string | null;
  personDisplayName: string;
  assignmentPct: AssignmentPctLabel;
  workingDays: number;
  expectedHours: number;
  developmentHours: number;
  bugHours: number;
  workedHours: number;
  newsHours: number;
  totalHours: number;
  newsCount: number;
  /** Días hábiles cubiertos por novedades en el periodo (para "Días novedades"). */
  newsDays: number;
  /** Detalle concatenado en una línea (`<tipo> - <título>` unidos). */
  newsDetail: string;
  /** Detalle por novedad (una entrada por novedad), para el tooltip numerado. */
  newsDetails: string[];
  compliancePct: number | null;
  semaforo: SemaforoLevel | null;
  deviationPct: number | null;
  deviationLevel: DeviationLevel | null;
}>;

export type HoursReportAlertKind =
  | "news_not_configured"
  | "news_story_deleted"
  | "incomplete_work_item"
  | "unconfigured_person";

export type HoursReportAlert = Readonly<{
  kind: HoursReportAlertKind;
  message: string;
}>;

export type HoursReportResult = Readonly<{
  rows: HoursReportRow[];
  generatedAt: string;
  alerts: HoursReportAlert[];
}>;
