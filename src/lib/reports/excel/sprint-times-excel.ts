import "server-only";

import ExcelJS from "exceljs";

import {
  EMPTY_HOURS_BREAKDOWN,
  totalHoursBreakdown,
} from "@/lib/dashboard/hours-breakdown";
import type { HoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import {
  lookupMemberOrPlaceholder,
  type MemberInfo,
} from "@/lib/reports/excel/member-info";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";
import { formatSprintDateRange } from "@/lib/time-log/format-options";

// ── App brand palette (light theme, purple accent) ──────────────────────────────
const COLOR = {
  headerBg: "FF8B5CF6",
  headerFg: "FFFFFFFF",
  subHeaderBg: "FFEDE9FE",
  subHeaderFg: "FF4C1D95",
  cardBg: "FFF8F8FA",
  foreground: "FF101013",
  mutedFg: "FF6B7280",
  border: "FFE5E7EB",
  weekOddBg: "FFF3EEFF",
  weekEvenBg: "FFFFFFFF",
  totalBg: "FFEDE9FE",
  totalFg: "FF4C1D95",
  accent: "FF7C3AED",
  bugAccent: "FFEF4444",
  placeholderFg: "FFB4B4C2",
} as const;

type BorderStyle = "thin" | "medium";
type BorderSide = "top" | "right" | "bottom" | "left";

type CellStyle = {
  fill?: string;
  font?: { bold?: boolean; italic?: boolean; color?: string; size?: number };
  alignment?: {
    horizontal: "left" | "center";
    vertical: "middle";
    wrapText?: boolean;
    indent?: number;
  };
  /** Estilo aplicado a los 4 lados del borde. */
  borderStyle?: BorderStyle;
  /** Si true, omite el borde derecho (útil para la última celda antes de una zona sin borde). */
  skipRightBorder?: boolean;
  /** NumFmt de Excel (ej. `"0.0\"h\""`). */
  numFmt?: string;
};

function styleCell(cell: ExcelJS.Cell, style: CellStyle): void {
  if (style.fill) {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: style.fill } };
  }
  if (style.font) {
    cell.font = {
      name: "Calibri",
      bold: style.font.bold ?? false,
      italic: style.font.italic ?? false,
      color: style.font.color ? { argb: style.font.color } : undefined,
      size: style.font.size ?? 10,
    };
  }
  if (style.alignment) {
    cell.alignment = style.alignment;
  }
  if (style.borderStyle) {
    const sides: Partial<Record<BorderSide, ExcelJS.Border>> = {
      top: { style: style.borderStyle, color: { argb: COLOR.border } },
      left: { style: style.borderStyle, color: { argb: COLOR.border } },
      bottom: { style: style.borderStyle, color: { argb: COLOR.border } },
    };
    if (!style.skipRightBorder) {
      sides.right = { style: style.borderStyle, color: { argb: COLOR.border } };
    }
    cell.border = sides;
  }
  if (style.numFmt) {
    cell.numFmt = style.numFmt;
  }
}

function centerAlign(wrap = false): CellStyle["alignment"] {
  return { horizontal: "center", vertical: "middle", wrapText: wrap };
}

function leftAlign(indent = 1, wrap = false): CellStyle["alignment"] {
  return { horizontal: "left", vertical: "middle", wrapText: wrap, indent };
}

// ── Domain helpers ────────────────────────────────────────────────────────────

function sumWeekBreakdowns(
  rows: readonly { weeks: readonly HoursBreakdown[] }[],
  weekIndex: number,
): HoursBreakdown {
  return rows.reduce<HoursBreakdown>(
    (acc, row) => {
      const w = row.weeks[weekIndex] ?? EMPTY_HOURS_BREAKDOWN;
      return {
        taskHours: acc.taskHours + w.taskHours,
        bugHours: acc.bugHours + w.bugHours,
      };
    },
    { ...EMPTY_HOURS_BREAKDOWN },
  );
}

function sumSprintBreakdowns(
  rows: readonly { sprint: HoursBreakdown }[],
): HoursBreakdown {
  return rows.reduce<HoursBreakdown>(
    (acc, row) => ({
      taskHours: acc.taskHours + row.sprint.taskHours,
      bugHours: acc.bugHours + row.sprint.bugHours,
    }),
    { ...EMPTY_HOURS_BREAKDOWN },
  );
}

function weekStripingBg(weekIndex: number): string {
  return weekIndex % 2 === 0 ? COLOR.weekOddBg : COLOR.weekEvenBg;
}

/**
 * Totales semanales de un sprint, rellenando con `EMPTY_HOURS_BREAKDOWN`
 * cuando el sprint tiene menos semanas que el ancho máximo del workbook.
 */
function computeSprintWeekTotals(
  rows: readonly { weeks: readonly HoursBreakdown[] }[],
  sprintWeekCount: number,
  totalWeekCount: number,
): HoursBreakdown[] {
  return Array.from({ length: totalWeekCount }, (_, idx) =>
    idx < sprintWeekCount
      ? sumWeekBreakdowns(rows, idx)
      : { ...EMPTY_HOURS_BREAKDOWN },
  );
}

/**
 * Acumula las horas de cada persona a través de varios sprints. Una persona
 * que trabajó en varios sprints aparece UNA sola vez, con un slot por sprint
 * (en el mismo orden que `sprints`); si no trabajó en un sprint, su slot vale 0.
 */
type UserAggregate = {
  assignee: string;
  /** Una entrada por sprint (mismo orden que `sprints`). */
  sprintHours: HoursBreakdown[];
  /** Total acumulado a través de todos los sprints. */
  sprint: HoursBreakdown;
  memberInfo: MemberInfo;
};

function aggregateUsersAcrossSprints(
  sprints: ReadonlyArray<{ times: SprintTimesMetrics }>,
  sprintCount: number,
  memberRoles: Map<string, MemberInfo>,
): UserAggregate[] {
  const empty = (): HoursBreakdown => ({ ...EMPTY_HOURS_BREAKDOWN });
  const byUser = new Map<
    string,
    { sprintHours: HoursBreakdown[]; sprint: HoursBreakdown }
  >();

  for (let i = 0; i < sprintCount; i++) {
    const sprintEntry = sprints[i];
    for (const personRow of sprintEntry.times.rows) {
      let agg = byUser.get(personRow.assignee);
      if (!agg) {
        agg = {
          sprintHours: Array.from({ length: sprintCount }, empty),
          sprint: empty(),
        };
        byUser.set(personRow.assignee, agg);
      }

      const slot = agg.sprintHours[i];
      agg.sprintHours[i] = {
        taskHours: slot.taskHours + personRow.sprint.taskHours,
        bugHours: slot.bugHours + personRow.sprint.bugHours,
      };
      agg.sprint = {
        taskHours: agg.sprint.taskHours + personRow.sprint.taskHours,
        bugHours: agg.sprint.bugHours + personRow.sprint.bugHours,
      };
    }
  }

  const aggregates: UserAggregate[] = [...byUser.entries()].map(
    ([assignee, data]) => ({
      assignee,
      sprintHours: data.sprintHours,
      sprint: data.sprint,
      memberInfo: lookupMemberOrPlaceholder(memberRoles, assignee),
    }),
  );

  // Mismo orden que el helper single-sprint: total de horas desc, luego alfabético.
  aggregates.sort((left, right) => {
    const diff = totalHoursBreakdown(right.sprint) - totalHoursBreakdown(left.sprint);
    if (diff !== 0) return diff;
    return left.assignee.localeCompare(right.assignee, "es");
  });

  return aggregates;
}

// ── Layout config ─────────────────────────────────────────────────────────────

const PERSONA_COL_WIDTH = 32;
const ROL_COL_WIDTH = 36;
const SPRINT_COL_WIDTH = 28;
const WEEK_SUB_COL_WIDTH = 10;
const SPRINT_TIER_COL_WIDTH = 14;
const WEEK_SUB_COLS = 3;
const SPRINT_TIER_COLS = 3;
const HOURS_NUMFMT = `0.0"h"`;

function buildColumnLayout(weekCount: number): Partial<ExcelJS.Column>[] {
  return [
    { width: PERSONA_COL_WIDTH },
    { width: ROL_COL_WIDTH },
    ...Array.from({ length: weekCount * WEEK_SUB_COLS }, () => ({
      width: WEEK_SUB_COL_WIDTH,
    })),
    ...Array.from({ length: SPRINT_TIER_COLS }, () => ({
      width: SPRINT_TIER_COL_WIDTH,
    })),
  ];
}

/** 1-based column index del primer sub-col (Desarrollo) de una semana. */
function weekStartColumn(weekIdx: number): number {
  return 3 + weekIdx * WEEK_SUB_COLS;
}

/** 1-based column index del primer col de "Tiempos totales" (T. Desarrollo). */
function sprintTierStartColumn(weekCount: number): number {
  return 3 + weekCount * WEEK_SUB_COLS;
}

function sprintDevColumn(weekCount: number): number {
  return sprintTierStartColumn(weekCount);
}

function sprintBugColumn(weekCount: number): number {
  return sprintTierStartColumn(weekCount) + 1;
}

function sprintTotalColumn(weekCount: number): number {
  return sprintTierStartColumn(weekCount) + 2;
}

function totalColumnCount(weekCount: number): number {
  return sprintTotalColumn(weekCount);
}

// ── Cell builders (SRP: cada uno construye UNA celda) ──────────────────────────

function buildPersonaCell(
  cell: ExcelJS.Cell,
  displayName: string,
  email: string,
): void {
  cell.value = {
    richText: [
      {
        text: displayName,
        font: { bold: true, color: { argb: COLOR.foreground }, size: 10 },
      },
      {
        text: `\n${email}`,
        font: { color: { argb: COLOR.mutedFg }, size: 9 },
      },
    ],
  };
  styleCell(cell, {
    fill: COLOR.cardBg,
    alignment: leftAlign(1, true),
    borderStyle: "thin",
    skipRightBorder: true,
  });
}

function buildRolCell(cell: ExcelJS.Cell, role: string): void {
  cell.value = role;
  styleCell(cell, {
    fill: COLOR.cardBg,
    font: { color: COLOR.mutedFg, size: 10 },
    alignment: leftAlign(1),
    borderStyle: "thin",
    skipRightBorder: true,
  });
}

function buildHoursCell(
  cell: ExcelJS.Cell,
  value: number,
  opts: { fill: string; color: string; bold?: boolean; skipRightBorder?: boolean },
): void {
  cell.value = value;
  styleCell(cell, {
    fill: opts.fill,
    font: { color: opts.color, bold: opts.bold ?? false, size: 10 },
    alignment: centerAlign(),
    borderStyle: "thin",
    skipRightBorder: opts.skipRightBorder,
    numFmt: HOURS_NUMFMT,
  });
}

function buildWeekRow(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  breakdown: HoursBreakdown,
  weekIdx: number,
  borderStyle: BorderStyle = "thin",
): void {
  const bg = weekStripingBg(weekIdx);
  const start = weekStartColumn(weekIdx);
  const isMedium = borderStyle === "medium";
  const fg = isMedium ? COLOR.totalFg : COLOR.foreground;

  buildHoursCell(ws.getCell(excelRow, start), breakdown.taskHours, {
    fill: bg,
    color: COLOR.accent,
    bold: isMedium,
  });
  buildHoursCell(ws.getCell(excelRow, start + 1), totalHoursBreakdown(breakdown), {
    fill: bg,
    color: fg,
    bold: true,
  });
  buildHoursCell(ws.getCell(excelRow, start + 2), breakdown.bugHours, {
    fill: bg,
    color: COLOR.bugAccent,
    bold: isMedium,
  });
}

function buildSprintTierCells(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  breakdown: HoursBreakdown,
  weekCount: number,
  opts: { fill: string; fg: string; bold?: boolean },
): void {
  const isMedium = opts.bold ?? false;
  const accent = isMedium ? COLOR.totalFg : COLOR.foreground;
  buildHoursCell(ws.getCell(excelRow, sprintDevColumn(weekCount)), breakdown.taskHours, {
    fill: opts.fill,
    color: COLOR.accent,
    bold: isMedium,
  });
  buildHoursCell(ws.getCell(excelRow, sprintBugColumn(weekCount)), breakdown.bugHours, {
    fill: opts.fill,
    color: COLOR.bugAccent,
    bold: isMedium,
  });
  buildHoursCell(ws.getCell(excelRow, sprintTotalColumn(weekCount)), totalHoursBreakdown(breakdown), {
    fill: opts.fill,
    color: accent,
    bold: true,
  });
}

// ── Section builders ──────────────────────────────────────────────────────────

function writeTitleRow(
  ws: ExcelJS.Worksheet,
  row: number,
  colCount: number,
  generatedAt: Date,
  subtitlePrefix?: string,
): void {
  ws.mergeCells(row, 1, row, colCount);
  const title = ws.getCell(row, 1);
  title.value = "REPORTE DE TIEMPOS REGISTRADOS";
  styleCell(title, {
    fill: COLOR.headerBg,
    font: { bold: true, color: COLOR.headerFg, size: 14 },
    alignment: { horizontal: "center", vertical: "middle" },
  });

  ws.mergeCells(row + 1, 1, row + 1, colCount);
  const subtitle = ws.getCell(row + 1, 1);
  const generatedLabel = `Generado por NeosView · ${generatedAt.toLocaleString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;
  subtitle.value = subtitlePrefix
    ? `${subtitlePrefix} · ${generatedLabel}`
    : generatedLabel;
  styleCell(subtitle, {
    fill: COLOR.subHeaderBg,
    font: { color: COLOR.subHeaderFg, size: 10, italic: true },
    alignment: leftAlign(1),
  });
}

function writeMetadataRows(
  ws: ExcelJS.Worksheet,
  startRow: number,
  colCount: number,
  meta: { project: string; team: string; sprintName: string; scopeLabel: string },
): void {
  const midCol = Math.ceil(colCount / 2);

  ws.mergeCells(startRow, 1, startRow, midCol);
  styleCell(ws.getCell(startRow, 1), {
    fill: COLOR.cardBg,
    font: { color: COLOR.foreground, size: 10 },
    alignment: leftAlign(1),
  });
  ws.getCell(startRow, 1).value = `Proyecto: ${meta.project}`;

  ws.mergeCells(startRow, midCol + 1, startRow, colCount);
  styleCell(ws.getCell(startRow, midCol + 1), {
    fill: COLOR.cardBg,
    font: { color: COLOR.foreground, size: 10 },
    alignment: leftAlign(1),
  });
  ws.getCell(startRow, midCol + 1).value = `Equipo: ${meta.team}`;

  ws.mergeCells(startRow + 1, 1, startRow + 1, midCol);
  styleCell(ws.getCell(startRow + 1, 1), {
    fill: COLOR.cardBg,
    font: { color: COLOR.foreground, size: 10 },
    alignment: leftAlign(1),
  });
  ws.getCell(startRow + 1, 1).value = `Sprint: ${meta.sprintName}`;

  ws.mergeCells(startRow + 1, midCol + 1, startRow + 1, colCount);
  styleCell(ws.getCell(startRow + 1, midCol + 1), {
    fill: COLOR.cardBg,
    font: { color: COLOR.foreground, size: 10 },
    alignment: leftAlign(1),
  });
  ws.getCell(startRow + 1, midCol + 1).value = meta.scopeLabel;
}

function writeHeaderRow(
  ws: ExcelJS.Worksheet,
  row: number,
  weekLabels: ReadonlyArray<{ label: string; dateRangeLabel: string }>,
): void {
  // Persona | Rol (sin borde derecho)
  styleCell(ws.getCell(row, 1), {
    fill: COLOR.subHeaderBg,
    font: { bold: true, color: COLOR.subHeaderFg, size: 11 },
    alignment: centerAlign(),
    borderStyle: "thin",
    skipRightBorder: true,
  });
  ws.getCell(row, 1).value = "Persona";

  styleCell(ws.getCell(row, 2), {
    fill: COLOR.subHeaderBg,
    font: { bold: true, color: COLOR.subHeaderFg, size: 11 },
    alignment: centerAlign(),
    borderStyle: "thin",
    skipRightBorder: true,
  });
  ws.getCell(row, 2).value = "Rol";

  // Por cada semana: merge 3 columnas
  weekLabels.forEach((week, idx) => {
    const start = weekStartColumn(idx);
    const end = start + WEEK_SUB_COLS - 1;
    ws.mergeCells(row, start, row, end);
    const cell = ws.getCell(row, start);
    cell.value = {
      richText: [
        {
          text: week.label,
          font: { bold: true, color: { argb: COLOR.subHeaderFg }, size: 11 },
        },
        {
          text: `\n${week.dateRangeLabel}`,
          font: { color: { argb: COLOR.mutedFg }, size: 9, italic: true },
        },
      ],
    };
    styleCell(cell, {
      fill: COLOR.subHeaderBg,
      alignment: centerAlign(true),
      borderStyle: "thin",
    });
    for (let c = start; c <= end; c++) {
      styleCell(ws.getCell(row, c), {
        fill: COLOR.subHeaderBg,
        borderStyle: "thin",
      });
    }
  });

  // "Tiempos totales" merged 3 cols
  const tierStart = sprintTierStartColumn(weekLabels.length);
  ws.mergeCells(row, tierStart, row, tierStart + SPRINT_TIER_COLS - 1);
  styleCell(ws.getCell(row, tierStart), {
    fill: COLOR.subHeaderBg,
    font: { bold: true, color: COLOR.subHeaderFg, size: 11 },
    alignment: centerAlign(),
    borderStyle: "thin",
  });
  ws.getCell(row, tierStart).value = "Tiempos totales";
  for (let c = tierStart; c < tierStart + SPRINT_TIER_COLS; c++) {
    styleCell(ws.getCell(row, c), {
      fill: COLOR.subHeaderBg,
      borderStyle: "thin",
    });
  }
}

function writeSubHeaderRow(
  ws: ExcelJS.Worksheet,
  row: number,
  weekCount: number,
  fixedColCount: 2 | 3 = 2,
): void {
  // Celdas vacías bajo las columnas fijas (Persona+Rol en single-sprint/summary;
  // Sprint+Persona+Rol en el workbook combinado).
  for (let c = 1; c <= fixedColCount; c++) {
    styleCell(ws.getCell(row, c), {
      fill: COLOR.subHeaderBg,
      borderStyle: "thin",
      skipRightBorder: c < fixedColCount,
    });
  }

  // Offset del primer bloque semanal: cols `fixedColCount + 1` en adelante.
  // (Para Persona+Rol = col 4; para Sprint+Persona+Rol = col 5.)
  // Antes este helper siempre usaba `weekStartColumn = 3`, lo que dejaba
  // las sub-cabeceras una columna a la izquierda de los valores en el
  // workbook combinado (los valores usan `combinedWeekStartColumn = 4`).
  const firstWeekStartCol = fixedColCount + 1;
  const firstTierStartCol = firstWeekStartCol + weekCount * WEEK_SUB_COLS;

  const subLabels: Array<{ text: string; color: string }> = [
    { text: "Desarrollo", color: COLOR.accent },
    { text: "Total", color: COLOR.foreground },
    { text: "Bugs", color: COLOR.bugAccent },
  ];

  for (let idx = 0; idx < weekCount; idx++) {
    const start = firstWeekStartCol + idx * WEEK_SUB_COLS;
    subLabels.forEach((label, subIdx) => {
      const cell = ws.getCell(row, start + subIdx);
      cell.value = label.text;
      styleCell(cell, {
        fill: COLOR.subHeaderBg,
        font: { color: label.color, bold: true, size: 9 },
        alignment: centerAlign(),
        borderStyle: "thin",
      });
    });
  }

  // Sub-headers de Tiempos totales
  const tierLabels: Array<{ text: string; color: string }> = [
    { text: "T. Desarrollo", color: COLOR.accent },
    { text: "T. Bugs", color: COLOR.bugAccent },
    { text: "T. Sprint", color: COLOR.foreground },
  ];
  tierLabels.forEach((label, idx) => {
    const cell = ws.getCell(row, firstTierStartCol + idx);
    cell.value = label.text;
    styleCell(cell, {
      fill: COLOR.subHeaderBg,
      font: { color: label.color, bold: true, size: 9 },
      alignment: centerAlign(),
      borderStyle: "thin",
    });
  });
}

function writePersonRow(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  row: { assignee: string; weeks: readonly HoursBreakdown[]; sprint: HoursBreakdown },
  memberInfo: MemberInfo,
  weekColumns: readonly { label: string }[],
): void {
  buildPersonaCell(ws.getCell(excelRow, 1), row.assignee, memberInfo.email);
  buildRolCell(ws.getCell(excelRow, 2), memberInfo.role);

  weekColumns.forEach((_, idx) => {
    const breakdown = row.weeks[idx] ?? EMPTY_HOURS_BREAKDOWN;
    buildWeekRow(ws, excelRow, breakdown, idx);
  });

  buildSprintTierCells(ws, excelRow, row.sprint, weekColumns.length, {
    fill: COLOR.cardBg,
    fg: COLOR.foreground,
  });
}

function writeTotalsRow(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  weekTotals: readonly HoursBreakdown[],
  sprintTotal: HoursBreakdown,
): void {
  // Celda "Persona" del Total equipo
  styleCell(ws.getCell(excelRow, 1), {
    fill: COLOR.totalBg,
    font: { bold: true, color: COLOR.totalFg, size: 11 },
    alignment: leftAlign(1),
    borderStyle: "medium",
    skipRightBorder: true,
  });
  ws.getCell(excelRow, 1).value = "Total equipo";

  // Celda "Rol" vacía
  styleCell(ws.getCell(excelRow, 2), {
    fill: COLOR.totalBg,
    borderStyle: "medium",
    skipRightBorder: true,
  });

  weekTotals.forEach((breakdown, idx) => {
    buildWeekRow(ws, excelRow, breakdown, idx, "medium");
  });

  buildSprintTierCells(ws, excelRow, sprintTotal, weekTotals.length, {
    fill: COLOR.totalBg,
    fg: COLOR.totalFg,
    bold: true,
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export type BuildSprintTimesExcelInput = {
  sprintName: string;
  project: string;
  team: string;
  times: SprintTimesMetrics;
  memberRoles: Map<string, MemberInfo>;
  weekIndex?: number;
  generatedAt?: Date;
};

export async function buildSprintTimesExcel(
  input: BuildSprintTimesExcelInput,
): Promise<ExcelJS.Buffer> {
  const { sprintName, project, team, times, memberRoles, weekIndex } = input;
  const generatedAt = input.generatedAt ?? new Date();
  const isWeekScope = weekIndex !== undefined && weekIndex >= 0;

  const weekColumns = isWeekScope ? [times.weeks[weekIndex]] : times.weeks;
  const weekCount = weekColumns?.length ?? 0;
  const colCount = totalColumnCount(weekCount);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NeosView";
  workbook.created = generatedAt;

  const ws = workbook.addWorksheet("Tiempos registrados");
  ws.columns = buildColumnLayout(weekCount);

  // Alturas de las filas de cabecera/metadata
  ws.getRow(1).height = 36;
  ws.getRow(2).height = 22;
  ws.getRow(3).height = 22;
  ws.getRow(4).height = 22;
  ws.getRow(5).height = 8;
  const GROUP_HEADER_ROW = 6;
  const SUB_HEADER_ROW = 7;
  ws.getRow(GROUP_HEADER_ROW).height = 30;
  ws.getRow(SUB_HEADER_ROW).height = 20;

  // Título + subtítulo
  writeTitleRow(ws, 1, colCount, generatedAt);

  // Metadata
  const scopeLabel = isWeekScope
    ? `Alcance: Semana ${(weekIndex ?? 0) + 1} — ${times.weeks[weekIndex ?? 0]?.dateRangeLabel ?? ""}`
    : "Alcance: Sprint completo";
  writeMetadataRows(ws, 3, colCount, { project, team, sprintName, scopeLabel });

  // Cabeceras
  writeHeaderRow(ws, GROUP_HEADER_ROW, weekColumns ?? []);
  writeSubHeaderRow(ws, SUB_HEADER_ROW, weekCount);

  // Datos
  const DATA_START_ROW = 8;
  let dataRowIdx = 0;
  for (const row of times.rows) {
    const excelRow = DATA_START_ROW + dataRowIdx;
    ws.getRow(excelRow).height = 32;
    const memberInfo = lookupMemberOrPlaceholder(memberRoles, row.assignee);
    writePersonRow(ws, excelRow, row, memberInfo, weekColumns ?? []);
    dataRowIdx++;
  }

  // Fila Total equipo
  const weekTotals: HoursBreakdown[] = isWeekScope
    ? [sumWeekBreakdowns(times.rows, weekIndex)]
    : Array.from({ length: weekCount }, (_, idx) => sumWeekBreakdowns(times.rows, idx));

  const sprintTotal = sumSprintBreakdowns(times.rows);
  const totalRowIdx = DATA_START_ROW + dataRowIdx;
  ws.getRow(totalRowIdx).height = 26;
  writeTotalsRow(ws, totalRowIdx, weekTotals, sprintTotal);

  return workbook.xlsx.writeBuffer();
}

// ── Combined (multi-sprint) Excel ─────────────────────────────────────────────

export type CombinedSprintTimesInput = {
  project: string;
  team: string;
  sprints: ReadonlyArray<{
    /** Nombre que se muestra en la columna "Sprint" y en el subtítulo. */
    sprintName: string;
    /** Fechas ISO del sprint (`YYYY-MM-DD`) — opcionales pero necesarias para
     *  mostrar el rango en la cabecera de la hoja "Resumen". */
    startDate?: string | null;
    finishDate?: string | null;
    times: SprintTimesMetrics;
  }>;
  memberRoles: Map<string, MemberInfo>;
  generatedAt?: Date;
};

/**
 * Construye un workbook con una sola hoja "Tiempos registrados" que combina
 * varios sprints. Una fila por `(sprint, persona)`, columna extra "Sprint"
 * al inicio y bloques semanales con el máximo de semanas entre los sprints
 * (los sprints con menos semanas rellenan vacío en las últimas columnas).
 *
 * Mantiene intacta la firma de `buildSprintTimesExcel` (sprint único) para
 * no romper el flujo de `use-sprint-share-export` ni la generación de PNG.
 */
export async function buildCombinedSprintTimesExcel(
  input: CombinedSprintTimesInput,
): Promise<ExcelJS.Buffer> {
  const { project, team, sprints, memberRoles } = input;
  const generatedAt = input.generatedAt ?? new Date();

  const weekCount = sprints.reduce(
    (max, sprint) => Math.max(max, sprint.times.weeks.length),
    0,
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NeosView";
  workbook.created = generatedAt;

  // 1) Hoja detalle: una fila por (sprint, persona) — la principal.
  const ws = workbook.addWorksheet("Tiempos registrados");

  // 2) Hoja resumen: una fila por persona con horas sumadas a través de sprints.
  writeSummarySheet(workbook, {
    project,
    team,
    generatedAt,
    aggregates: aggregateUsersAcrossSprints(sprints, sprints.length, memberRoles),
    sprints: sprints.map((sprint) => ({
      sprintName: sprint.sprintName,
      startDate: sprint.startDate,
      finishDate: sprint.finishDate,
    })),
  });

  // Layout: Sprint | Persona | Rol | (3 sub-cols × weekCount) | (3 tier cols)
  const COMBINED_FIXED_COLS = 3;
  const COMBINED_DATA_START_ROW = 8;
  const totalCols =
    COMBINED_FIXED_COLS + weekCount * WEEK_SUB_COLS + SPRINT_TIER_COLS;
  ws.columns = [
    { width: SPRINT_COL_WIDTH },
    { width: PERSONA_COL_WIDTH },
    { width: ROL_COL_WIDTH },
    ...Array.from({ length: weekCount * WEEK_SUB_COLS }, () => ({
      width: WEEK_SUB_COL_WIDTH,
    })),
    ...Array.from({ length: SPRINT_TIER_COLS }, () => ({
      width: SPRINT_TIER_COL_WIDTH,
    })),
  ];

  ws.getRow(1).height = 36;
  ws.getRow(2).height = 22;
  ws.getRow(3).height = 22;
  ws.getRow(4).height = 22;
  ws.getRow(5).height = 8;
  const GROUP_HEADER_ROW = 6;
  const SUB_HEADER_ROW = 7;
  ws.getRow(GROUP_HEADER_ROW).height = 30;
  ws.getRow(SUB_HEADER_ROW).height = 20;

  // Título + subtítulo (incluye rango si hay al menos un sprint)
  writeCombinedTitleRow(ws, 1, totalCols, generatedAt, sprints.length);

  // Metadata con lista de sprints incluidos
  writeCombinedMetadataRows(ws, 3, totalCols, {
    project,
    team,
    sprintNames: sprints.map((s) => s.sprintName),
    count: sprints.length,
  });

  // Cabeceras
  writeCombinedHeaderRow(ws, GROUP_HEADER_ROW, weekCount);
  writeSubHeaderRow(ws, SUB_HEADER_ROW, weekCount, 3);

  // Datos: una fila por (sprint, persona), agrupados por sprint.
  let dataRowIdx = 0;
  // Acumulamos subtotales por sprint para luego componer el total general.
  const sprintGroupTotals: Array<{
    weekTotals: HoursBreakdown[];
    sprintTotal: HoursBreakdown;
  }> = [];

  for (const sprintEntry of sprints) {
    const sprintName = sprintEntry.sprintName;
    const sprintWeeks = sprintEntry.times.weeks;

    for (const personRow of sprintEntry.times.rows) {
      const excelRow = COMBINED_DATA_START_ROW + dataRowIdx;
      ws.getRow(excelRow).height = 32;
      const memberInfo = lookupMemberOrPlaceholder(memberRoles, personRow.assignee);
      writeCombinedPersonRow(ws, excelRow, sprintName, personRow, memberInfo, weekCount);
      dataRowIdx++;
    }

    const sprintWeekTotals = computeSprintWeekTotals(
      sprintEntry.times.rows,
      sprintWeeks.length,
      weekCount,
    );
    const sprintTotal = sumSprintBreakdowns(sprintEntry.times.rows);
    sprintGroupTotals.push({ weekTotals: sprintWeekTotals, sprintTotal });

    const subtotalRow = COMBINED_DATA_START_ROW + dataRowIdx;
    ws.getRow(subtotalRow).height = 26;
    writeCombinedSprintSubtotalRow(
      ws,
      subtotalRow,
      sprintName,
      sprintWeekTotals,
      sprintTotal,
      weekCount,
    );
    dataRowIdx++;
  }

  if (sprints.length > 0) {
    // Adaptamos al contrato de `sumWeekBreakdowns` ({ weeks: HoursBreakdown[] }).
    const groupRows = sprintGroupTotals.map((g) => ({ weeks: g.weekTotals }));
    const overallWeekTotals = Array.from({ length: weekCount }, (_, idx) =>
      sumWeekBreakdowns(groupRows, idx),
    );
    const overallSprintTotal = sprintGroupTotals.reduce<HoursBreakdown>(
      (acc, group) => ({
        taskHours: acc.taskHours + group.sprintTotal.taskHours,
        bugHours: acc.bugHours + group.sprintTotal.bugHours,
      }),
      { ...EMPTY_HOURS_BREAKDOWN },
    );
    const totalRow = COMBINED_DATA_START_ROW + dataRowIdx;
    ws.getRow(totalRow).height = 28;
    writeCombinedGrandTotalRow(
      ws,
      totalRow,
      overallWeekTotals,
      overallSprintTotal,
      weekCount,
    );
  }

  return workbook.xlsx.writeBuffer();
}

// ── Combined sheet builders ───────────────────────────────────────────────────

function combinedWeekStartColumn(weekIdx: number): number {
  return 4 + weekIdx * WEEK_SUB_COLS;
}

function combinedTierStartColumn(weekCount: number): number {
  return 4 + weekCount * WEEK_SUB_COLS;
}

function writeCombinedTitleRow(
  ws: ExcelJS.Worksheet,
  row: number,
  colCount: number,
  generatedAt: Date,
  sprintCount: number,
): void {
  const subtitlePrefix =
    sprintCount === 1
      ? "1 sprint incluido"
      : `${sprintCount} sprints incluidos`;
  writeTitleRow(ws, row, colCount, generatedAt, subtitlePrefix);
}

function writeCombinedMetadataRows(
  ws: ExcelJS.Worksheet,
  startRow: number,
  colCount: number,
  meta: { project: string; team: string; sprintNames: readonly string[]; count: number },
): void {
  const midCol = Math.ceil(colCount / 2);

  ws.mergeCells(startRow, 1, startRow, midCol);
  styleCell(ws.getCell(startRow, 1), {
    fill: COLOR.cardBg,
    font: { color: COLOR.foreground, size: 10 },
    alignment: leftAlign(1),
  });
  ws.getCell(startRow, 1).value = `Proyecto: ${meta.project}`;

  ws.mergeCells(startRow, midCol + 1, startRow, colCount);
  styleCell(ws.getCell(startRow, midCol + 1), {
    fill: COLOR.cardBg,
    font: { color: COLOR.foreground, size: 10 },
    alignment: leftAlign(1),
  });
  ws.getCell(startRow, midCol + 1).value = `Equipo: ${meta.team}`;

  ws.mergeCells(startRow + 1, 1, startRow + 1, midCol);
  styleCell(ws.getCell(startRow + 1, 1), {
    fill: COLOR.cardBg,
    font: { color: COLOR.foreground, size: 10 },
    alignment: leftAlign(1),
  });
  ws.getCell(startRow + 1, 1).value =
    meta.count === 1
      ? `Sprint: ${meta.sprintNames[0] ?? ""}`
      : `Sprints (${meta.count}): ${meta.sprintNames.join(", ")}`;

  ws.mergeCells(startRow + 1, midCol + 1, startRow + 1, colCount);
  styleCell(ws.getCell(startRow + 1, midCol + 1), {
    fill: COLOR.cardBg,
    font: { color: COLOR.foreground, size: 10 },
    alignment: leftAlign(1),
  });
  ws.getCell(startRow + 1, midCol + 1).value =
    meta.count === 1 ? "Alcance: Sprint completo" : "Alcance: Combinado";
}

function writeCombinedHeaderRow(
  ws: ExcelJS.Worksheet,
  row: number,
  weekCount: number,
): void {
  // Sprint | Persona | Rol (sin borde derecho)
  for (let c = 1; c <= 3; c++) {
    styleCell(ws.getCell(row, c), {
      fill: COLOR.subHeaderBg,
      font: { bold: true, color: COLOR.subHeaderFg, size: 11 },
      alignment: centerAlign(),
      borderStyle: "thin",
      skipRightBorder: c < 3,
    });
  }
  ws.getCell(row, 1).value = "Sprint";
  ws.getCell(row, 2).value = "Persona";
  ws.getCell(row, 3).value = "Rol";

  // Cada semana ocupa 3 sub-columnas (Desarrollo / Total / Bugs), con su
  // cabecera merged igual que en el layout single-sprint.
  for (let idx = 0; idx < weekCount; idx++) {
    const start = combinedWeekStartColumn(idx);
    const end = start + WEEK_SUB_COLS - 1;
    ws.mergeCells(row, start, row, end);
    const cell = ws.getCell(row, start);
    cell.value = `Semana ${idx + 1}`;
    styleCell(cell, {
      fill: COLOR.subHeaderBg,
      font: { bold: true, color: COLOR.subHeaderFg, size: 11 },
      alignment: centerAlign(),
      borderStyle: "thin",
    });
    for (let c = start; c <= end; c++) {
      styleCell(ws.getCell(row, c), {
        fill: COLOR.subHeaderBg,
        borderStyle: "thin",
      });
    }
  }

  // "Tiempos totales" merged 3 cols
  const tierStart = combinedTierStartColumn(weekCount);
  ws.mergeCells(row, tierStart, row, tierStart + SPRINT_TIER_COLS - 1);
  styleCell(ws.getCell(row, tierStart), {
    fill: COLOR.subHeaderBg,
    font: { bold: true, color: COLOR.subHeaderFg, size: 11 },
    alignment: centerAlign(),
    borderStyle: "thin",
  });
  ws.getCell(row, tierStart).value = "Tiempos totales";
  for (let c = tierStart; c < tierStart + SPRINT_TIER_COLS; c++) {
    styleCell(ws.getCell(row, c), {
      fill: COLOR.subHeaderBg,
      borderStyle: "thin",
    });
  }
}

function writeCombinedPersonRow(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  sprintName: string,
  row: { assignee: string; weeks: readonly HoursBreakdown[]; sprint: HoursBreakdown },
  memberInfo: MemberInfo,
  weekCount: number,
): void {
  // Sprint
  styleCell(ws.getCell(excelRow, 1), {
    fill: COLOR.cardBg,
    font: { color: COLOR.accent, bold: true, size: 10 },
    alignment: leftAlign(1),
    borderStyle: "thin",
  });
  ws.getCell(excelRow, 1).value = sprintName;

  buildPersonaCell(ws.getCell(excelRow, 2), row.assignee, memberInfo.email);
  buildRolCell(ws.getCell(excelRow, 3), memberInfo.role);

  // Semanas: si el sprint tiene menos semanas que weekCount, escribir EMPTY.
  for (let idx = 0; idx < weekCount; idx++) {
    const breakdown = row.weeks[idx] ?? EMPTY_HOURS_BREAKDOWN;
    buildCombinedWeekCells(ws, excelRow, breakdown, idx);
  }

  buildCombinedSprintTierCells(ws, excelRow, row.sprint, weekCount, {
    fill: COLOR.cardBg,
    fg: COLOR.foreground,
  });
}

function buildCombinedWeekCells(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  breakdown: HoursBreakdown,
  weekIdx: number,
  borderStyle: BorderStyle = "thin",
): void {
  // En el layout combinado, las columnas semanales empiezan una posición
  // después que en el single-sprint (existe la columna "Sprint" adicional).
  const start = combinedWeekStartColumn(weekIdx);
  const bg = weekStripingBg(weekIdx);
  const isMedium = borderStyle === "medium";
  const fg = isMedium ? COLOR.totalFg : COLOR.foreground;

  buildHoursCell(ws.getCell(excelRow, start), breakdown.taskHours, {
    fill: bg,
    color: COLOR.accent,
    bold: isMedium,
  });
  buildHoursCell(ws.getCell(excelRow, start + 1), totalHoursBreakdown(breakdown), {
    fill: bg,
    color: fg,
    bold: true,
  });
  buildHoursCell(ws.getCell(excelRow, start + 2), breakdown.bugHours, {
    fill: bg,
    color: COLOR.bugAccent,
    bold: isMedium,
  });
}

function buildCombinedSprintTierCells(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  breakdown: HoursBreakdown,
  weekCount: number,
  opts: { fill: string; fg: string; bold?: boolean },
): void {
  const isMedium = opts.bold ?? false;
  const accent = isMedium ? COLOR.totalFg : COLOR.foreground;
  const tierStart = combinedTierStartColumn(weekCount);
  buildHoursCell(ws.getCell(excelRow, tierStart), breakdown.taskHours, {
    fill: opts.fill,
    color: COLOR.accent,
    bold: isMedium,
  });
  buildHoursCell(ws.getCell(excelRow, tierStart + 1), breakdown.bugHours, {
    fill: opts.fill,
    color: COLOR.bugAccent,
    bold: isMedium,
  });
  buildHoursCell(
    ws.getCell(excelRow, tierStart + 2),
    totalHoursBreakdown(breakdown),
    {
      fill: opts.fill,
      color: accent,
      bold: true,
    },
  );
}

function writeCombinedSprintSubtotalRow(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  sprintName: string,
  weekTotals: readonly HoursBreakdown[],
  sprintTotal: HoursBreakdown,
  weekCount: number,
): void {
  styleCell(ws.getCell(excelRow, 1), {
    fill: COLOR.subHeaderBg,
    font: { bold: true, color: COLOR.subHeaderFg, size: 10 },
    alignment: leftAlign(1),
    borderStyle: "medium",
  });
  ws.getCell(excelRow, 1).value = `Subtotal ${sprintName}`;

  // Persona y Rol vacías con borde medio
  styleCell(ws.getCell(excelRow, 2), {
    fill: COLOR.subHeaderBg,
    borderStyle: "medium",
    skipRightBorder: true,
  });
  styleCell(ws.getCell(excelRow, 3), {
    fill: COLOR.subHeaderBg,
    borderStyle: "medium",
    skipRightBorder: true,
  });

  for (let idx = 0; idx < weekCount; idx++) {
    const breakdown = weekTotals[idx] ?? EMPTY_HOURS_BREAKDOWN;
    buildCombinedWeekCells(ws, excelRow, breakdown, idx, "medium");
  }

  buildCombinedSprintTierCells(ws, excelRow, sprintTotal, weekCount, {
    fill: COLOR.subHeaderBg,
    fg: COLOR.subHeaderFg,
    bold: true,
  });
}

function writeCombinedGrandTotalRow(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  weekTotals: readonly HoursBreakdown[],
  sprintTotal: HoursBreakdown,
  weekCount: number,
): void {
  styleCell(ws.getCell(excelRow, 1), {
    fill: COLOR.totalBg,
    font: { bold: true, color: COLOR.totalFg, size: 11 },
    alignment: leftAlign(1),
    borderStyle: "medium",
    skipRightBorder: true,
  });
  ws.getCell(excelRow, 1).value = "Total general";

  styleCell(ws.getCell(excelRow, 2), {
    fill: COLOR.totalBg,
    borderStyle: "medium",
    skipRightBorder: true,
  });
  styleCell(ws.getCell(excelRow, 3), {
    fill: COLOR.totalBg,
    borderStyle: "medium",
    skipRightBorder: true,
  });

  for (let idx = 0; idx < weekCount; idx++) {
    const breakdown = weekTotals[idx] ?? EMPTY_HOURS_BREAKDOWN;
    buildCombinedWeekCells(ws, excelRow, breakdown, idx, "medium");
  }

  buildCombinedSprintTierCells(ws, excelRow, sprintTotal, weekCount, {
    fill: COLOR.totalBg,
    fg: COLOR.totalFg,
    bold: true,
  });
}

// ── Summary sheet (multi-sprint only) ─────────────────────────────────────────

type WriteSummarySheetInput = {
  project: string;
  team: string;
  generatedAt: Date;
  aggregates: UserAggregate[];
  sprints: ReadonlyArray<{
    sprintName: string;
    startDate?: string | null;
    finishDate?: string | null;
  }>;
};

function resolveSprintMeta(sprint: {
  sprintName: string;
  startDate?: string | null;
  finishDate?: string | null;
}): SummarySprintMeta {
  return {
    name: sprint.sprintName,
    dateRangeLabel: formatSprintDateRange(
      sprint.startDate ?? undefined,
      sprint.finishDate ?? undefined,
    ),
  };
}

type SummarySprintMeta = {
  name: string;
  /** Rango ya formateado (p. ej. "10 mar – 23 mar"). `null` si faltan fechas. */
  dateRangeLabel: string | null;
};

function writeSummarySheet(
  workbook: ExcelJS.Workbook,
  input: WriteSummarySheetInput,
): void {
  const { project, team, generatedAt, aggregates, sprints } = input;
  const sprintsMeta = sprints.map(resolveSprintMeta);
  const sprintCount = sprintsMeta.length;

  const ws = workbook.addWorksheet("Resumen");
  // Layout: Persona | Rol | (3 sub-cols × sprintCount) | (3 tier cols)
  const SUMMARY_FIXED_COLS = 2;
  const SUMMARY_DATA_START_ROW = 8;
  const totalCols =
    SUMMARY_FIXED_COLS + sprintCount * WEEK_SUB_COLS + SPRINT_TIER_COLS;
  ws.columns = [
    { width: PERSONA_COL_WIDTH },
    { width: ROL_COL_WIDTH },
    ...Array.from({ length: sprintCount * WEEK_SUB_COLS }, () => ({
      width: WEEK_SUB_COL_WIDTH,
    })),
    ...Array.from({ length: SPRINT_TIER_COLS }, () => ({
      width: SPRINT_TIER_COL_WIDTH,
    })),
  ];

  ws.getRow(1).height = 36;
  ws.getRow(2).height = 22;
  ws.getRow(3).height = 22;
  ws.getRow(4).height = 22;
  ws.getRow(5).height = 8;
  const GROUP_HEADER_ROW = 6;
  const SUB_HEADER_ROW = 7;
  ws.getRow(GROUP_HEADER_ROW).height = 36;
  ws.getRow(SUB_HEADER_ROW).height = 20;

  writeTitleRow(
    ws,
    1,
    totalCols,
    generatedAt,
    `Resumen · ${sprintCount} sprints`,
  );

  writeMetadataRows(ws, 3, totalCols, {
    project,
    team,
    sprintName: "Resumen combinado",
    scopeLabel: "Alcance: Horas por sprint, sumadas por persona",
  });

  writeSummaryHeaderRow(ws, GROUP_HEADER_ROW, sprintsMeta);
  writeSubHeaderRow(ws, SUB_HEADER_ROW, sprintCount, 2);

  // Adaptamos los aggregates al shape que espera `writePersonRow`.
  const stubColumns: ReadonlyArray<{ label: string }> = Array.from(
    { length: sprintCount },
    () => ({ label: "" }),
  );

  let dataRowIdx = 0;
  for (const aggregate of aggregates) {
    const excelRow = SUMMARY_DATA_START_ROW + dataRowIdx;
    ws.getRow(excelRow).height = 32;
    writePersonRow(
      ws,
      excelRow,
      {
        assignee: aggregate.assignee,
        weeks: aggregate.sprintHours,
        sprint: aggregate.sprint,
      },
      aggregate.memberInfo,
      stubColumns,
    );
    dataRowIdx++;
  }

  // Fila Total equipo (suma por sprint column + total general).
  // Adaptamos al shape que espera `sumWeekBreakdowns`.
  const adaptedAggregates = aggregates.map((agg) => ({
    weeks: agg.sprintHours,
  }));
  const sprintColTotals = Array.from({ length: sprintCount }, (_, idx) =>
    sumWeekBreakdowns(adaptedAggregates, idx),
  );
  const sprintTotal = sumSprintBreakdowns(aggregates);
  const totalRow = SUMMARY_DATA_START_ROW + dataRowIdx;
  ws.getRow(totalRow).height = 26;
  writeTotalsRow(ws, totalRow, sprintColTotals, sprintTotal);
}

/**
 * Cabeceras de la hoja Resumen: Persona | Rol | una columna merged de 3
 * celdas por sprint (con el nombre del sprint y, debajo en cursiva, su
 * rango de fechas) | Tiempos totales merged.
 */
function writeSummaryHeaderRow(
  ws: ExcelJS.Worksheet,
  row: number,
  sprintsMeta: ReadonlyArray<SummarySprintMeta>,
): void {
  styleCell(ws.getCell(row, 1), {
    fill: COLOR.subHeaderBg,
    font: { bold: true, color: COLOR.subHeaderFg, size: 11 },
    alignment: centerAlign(),
    borderStyle: "thin",
    skipRightBorder: true,
  });
  ws.getCell(row, 1).value = "Persona";

  styleCell(ws.getCell(row, 2), {
    fill: COLOR.subHeaderBg,
    font: { bold: true, color: COLOR.subHeaderFg, size: 11 },
    alignment: centerAlign(),
    borderStyle: "thin",
    skipRightBorder: true,
  });
  ws.getCell(row, 2).value = "Rol";

  sprintsMeta.forEach((sprint, idx) => {
    const start = weekStartColumn(idx);
    const end = start + WEEK_SUB_COLS - 1;
    ws.mergeCells(row, start, row, end);
    const cell = ws.getCell(row, start);
    cell.value = sprint.dateRangeLabel
      ? {
          richText: [
            {
              text: sprint.name,
              font: { bold: true, color: { argb: COLOR.subHeaderFg }, size: 11 },
            },
            {
              text: `\n${sprint.dateRangeLabel}`,
              font: { color: { argb: COLOR.mutedFg }, size: 9, italic: true },
            },
          ],
        }
      : sprint.name;
    styleCell(cell, {
      fill: COLOR.subHeaderBg,
      alignment: centerAlign(true),
      borderStyle: "thin",
    });
    for (let c = start; c <= end; c++) {
      styleCell(ws.getCell(row, c), {
        fill: COLOR.subHeaderBg,
        borderStyle: "thin",
      });
    }
  });

  const tierStart = sprintTierStartColumn(sprintsMeta.length);
  ws.mergeCells(row, tierStart, row, tierStart + SPRINT_TIER_COLS - 1);
  styleCell(ws.getCell(row, tierStart), {
    fill: COLOR.subHeaderBg,
    font: { bold: true, color: COLOR.subHeaderFg, size: 11 },
    alignment: centerAlign(),
    borderStyle: "thin",
  });
  ws.getCell(row, tierStart).value = "Tiempos totales";
  for (let c = tierStart; c < tierStart + SPRINT_TIER_COLS; c++) {
    styleCell(ws.getCell(row, c), {
      fill: COLOR.subHeaderBg,
      borderStyle: "thin",
    });
  }
}

/**
 * Sub-cabeceras "Desarrollo | Total | Bugs" repetidas por cada sprint.
 * Reutiliza `writeSubHeaderRow` con `fixedColCount = 2` (Persona | Rol).
 */