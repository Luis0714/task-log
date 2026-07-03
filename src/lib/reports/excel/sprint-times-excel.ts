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

// ── Layout config ─────────────────────────────────────────────────────────────

const PERSONA_COL_WIDTH = 32;
const ROL_COL_WIDTH = 36;
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
  subtitle.value = `Generado por NeosView · ${generatedAt.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })}`;
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

function writeSubHeaderRow(ws: ExcelJS.Worksheet, row: number, weekCount: number): void {
  // Celdas vacías bajo Persona y Rol
  for (let c = 1; c <= 2; c++) {
    styleCell(ws.getCell(row, c), {
      fill: COLOR.subHeaderBg,
      borderStyle: "thin",
      skipRightBorder: c === 2,
    });
  }

  const subLabels: Array<{ text: string; color: string }> = [
    { text: "Desarrollo", color: COLOR.accent },
    { text: "Total", color: COLOR.foreground },
    { text: "Bugs", color: COLOR.bugAccent },
  ];

  for (let idx = 0; idx < weekCount; idx++) {
    const start = weekStartColumn(idx);
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
  const tierStart = sprintTierStartColumn(weekCount);
  tierLabels.forEach((label, idx) => {
    const cell = ws.getCell(row, tierStart + idx);
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