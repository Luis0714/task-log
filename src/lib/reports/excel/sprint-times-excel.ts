import "server-only";

import ExcelJS from "exceljs";

import {
  EMPTY_HOURS_BREAKDOWN,
  totalHoursBreakdown,
} from "@/lib/hours/hours-breakdown";
import type { HoursBreakdown } from "@/lib/hours/hours-breakdown";
import { resolveAdoTimeZone } from "@/lib/azure-devops/working-date-field";
import {
  COLOR,
  buildHoursCell,
  buildPersonaCell,
  buildRolCell,
  centerAlign,
  leftAlign,
  styleCell,
  type BorderStyle,
  type CellFont,
} from "@/lib/reports/excel/excel-styles";
import {
  lookupMemberOrPlaceholder,
  type MemberInfo,
} from "@/lib/reports/excel/member-info";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";
import {
  sumSprintBreakdowns,
  sumWeekBreakdowns,
} from "@/lib/sprints/sum-hours-breakdowns";
import { formatSprintDateRange } from "@/lib/time-log/format-options";

// ── Domain helpers ────────────────────────────────────────────────────────────

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

const GROUP_HEADER_ROW = 6;
const SUB_HEADER_ROW = 7;
const DATA_START_ROW = 8;

const GROUP_HEADER_FONT: CellFont = {
  bold: true,
  color: COLOR.subHeaderFg,
  size: 11,
};

function buildColumnLayout(
  weekCount: number,
  leadingWidths: readonly number[] = [PERSONA_COL_WIDTH, ROL_COL_WIDTH],
): Partial<ExcelJS.Column>[] {
  return [
    ...leadingWidths.map((width) => ({ width })),
    ...Array.from({ length: weekCount * WEEK_SUB_COLS }, () => ({
      width: WEEK_SUB_COL_WIDTH,
    })),
    ...Array.from({ length: SPRINT_TIER_COLS }, () => ({
      width: SPRINT_TIER_COL_WIDTH,
    })),
  ];
}

function applyHeaderRowHeights(ws: ExcelJS.Worksheet, groupHeaderHeight = 30): void {
  ws.getRow(1).height = 36;
  ws.getRow(2).height = 22;
  ws.getRow(3).height = 22;
  ws.getRow(4).height = 22;
  ws.getRow(5).height = 8;
  ws.getRow(GROUP_HEADER_ROW).height = groupHeaderHeight;
  ws.getRow(SUB_HEADER_ROW).height = 20;
}

/** 1-based column index del primer sub-col (Desarrollo) de una semana. */
function weekStartColumn(weekIdx: number): number {
  return 3 + weekIdx * WEEK_SUB_COLS;
}

/** 1-based column index del primer col de "Tiempos totales" (T. Desarrollo). */
function sprintTierStartColumn(weekCount: number): number {
  return 3 + weekCount * WEEK_SUB_COLS;
}

function totalColumnCount(weekCount: number): number {
  return sprintTierStartColumn(weekCount) + SPRINT_TIER_COLS - 1;
}

// En el layout combinado existe la columna "Sprint" adicional, por lo que las
// columnas semanales y el tier empiezan una posición después.
function combinedWeekStartColumn(weekIdx: number): number {
  return 4 + weekIdx * WEEK_SUB_COLS;
}

function combinedTierStartColumn(weekCount: number): number {
  return 4 + weekCount * WEEK_SUB_COLS;
}

// ── Cell builders (SRP: cada uno construye UNA zona de la fila) ────────────────

function buildWeekCells(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  breakdown: HoursBreakdown,
  weekIdx: number,
  startColumn: number,
  borderStyle: BorderStyle = "thin",
): void {
  const bg = weekStripingBg(weekIdx);
  const isMedium = borderStyle === "medium";
  const fg = isMedium ? COLOR.totalFg : COLOR.foreground;

  buildHoursCell(ws.getCell(excelRow, startColumn), breakdown.taskHours, {
    fill: bg,
    color: COLOR.accent,
    bold: isMedium,
  });
  buildHoursCell(ws.getCell(excelRow, startColumn + 1), totalHoursBreakdown(breakdown), {
    fill: bg,
    color: fg,
    bold: true,
  });
  buildHoursCell(ws.getCell(excelRow, startColumn + 2), breakdown.bugHours, {
    fill: bg,
    color: COLOR.bugAccent,
    bold: isMedium,
  });
}

function buildTierCells(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  breakdown: HoursBreakdown,
  tierStart: number,
  opts: { fill: string; bold?: boolean },
): void {
  const isMedium = opts.bold ?? false;
  const totalColor = isMedium ? COLOR.totalFg : COLOR.foreground;
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
  buildHoursCell(ws.getCell(excelRow, tierStart + 2), totalHoursBreakdown(breakdown), {
    fill: opts.fill,
    color: totalColor,
    bold: true,
  });
}

// ── Header builders ───────────────────────────────────────────────────────────

function writeFixedHeaderCells(
  ws: ExcelJS.Worksheet,
  row: number,
  labels: readonly string[],
  opts: { skipLastRightBorder?: boolean } = {},
): void {
  labels.forEach((label, idx) => {
    const col = idx + 1;
    const isLast = idx === labels.length - 1;
    styleCell(ws.getCell(row, col), {
      fill: COLOR.subHeaderBg,
      font: GROUP_HEADER_FONT,
      alignment: centerAlign(),
      borderStyle: "thin",
      skipRightBorder: isLast ? (opts.skipLastRightBorder ?? true) : true,
    });
    ws.getCell(row, col).value = label;
  });
}

function writeGroupHeaderCell(
  ws: ExcelJS.Worksheet,
  row: number,
  start: number,
  value: ExcelJS.CellValue,
  opts: { colSpan?: number; wrap?: boolean; font?: CellFont } = {},
): void {
  const end = start + (opts.colSpan ?? WEEK_SUB_COLS) - 1;
  ws.mergeCells(row, start, row, end);
  const cell = ws.getCell(row, start);
  cell.value = value;
  styleCell(cell, {
    fill: COLOR.subHeaderBg,
    font: opts.font,
    alignment: centerAlign(opts.wrap ?? false),
    borderStyle: "thin",
  });
  for (let c = start; c <= end; c++) {
    styleCell(ws.getCell(row, c), {
      fill: COLOR.subHeaderBg,
      borderStyle: "thin",
    });
  }
}

function writeTierHeaderCell(
  ws: ExcelJS.Worksheet,
  row: number,
  tierStart: number,
): void {
  writeGroupHeaderCell(ws, row, tierStart, "Tiempos totales", {
    colSpan: SPRINT_TIER_COLS,
    font: GROUP_HEADER_FONT,
  });
}

function twoLineHeaderValue(title: string, subtitle: string): ExcelJS.CellValue {
  return {
    richText: [
      {
        text: title,
        font: { bold: true, color: { argb: COLOR.subHeaderFg }, size: 11 },
      },
      {
        text: `\n${subtitle}`,
        font: { color: { argb: COLOR.mutedFg }, size: 9, italic: true },
      },
    ],
  };
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
    timeZone: resolveAdoTimeZone(),
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

type MetadataLabels = {
  project: string;
  team: string;
  sprintLabel: string;
  scopeLabel: string;
};

function writeMetadataRows(
  ws: ExcelJS.Worksheet,
  startRow: number,
  colCount: number,
  meta: MetadataLabels,
): void {
  const midCol = Math.ceil(colCount / 2);
  const cells = [
    { row: startRow, from: 1, to: midCol, text: `Proyecto: ${meta.project}` },
    { row: startRow, from: midCol + 1, to: colCount, text: `Equipo: ${meta.team}` },
    { row: startRow + 1, from: 1, to: midCol, text: meta.sprintLabel },
    { row: startRow + 1, from: midCol + 1, to: colCount, text: meta.scopeLabel },
  ];

  for (const { row, from, to, text } of cells) {
    ws.mergeCells(row, from, row, to);
    const cell = ws.getCell(row, from);
    styleCell(cell, {
      fill: COLOR.cardBg,
      font: { color: COLOR.foreground, size: 10 },
      alignment: leftAlign(1),
    });
    cell.value = text;
  }
}

function writeHeaderRow(
  ws: ExcelJS.Worksheet,
  row: number,
  weekLabels: ReadonlyArray<{ label: string; dateRangeLabel: string }>,
): void {
  writeFixedHeaderCells(ws, row, ["Persona", "Rol"]);

  weekLabels.forEach((week, idx) => {
    writeGroupHeaderCell(
      ws,
      row,
      weekStartColumn(idx),
      twoLineHeaderValue(week.label, week.dateRangeLabel),
      { wrap: true },
    );
  });

  writeTierHeaderCell(ws, row, sprintTierStartColumn(weekLabels.length));
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

  const writeSubLabel = (col: number, text: string, color: string): void => {
    const cell = ws.getCell(row, col);
    cell.value = text;
    styleCell(cell, {
      fill: COLOR.subHeaderBg,
      font: { color, bold: true, size: 9 },
      alignment: centerAlign(),
      borderStyle: "thin",
    });
  };

  // Offset del primer bloque semanal: cols `fixedColCount + 1` en adelante.
  // (Para Persona+Rol = col 4; para Sprint+Persona+Rol = col 5.)
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
      writeSubLabel(start + subIdx, label.text, label.color);
    });
  }

  const tierLabels: Array<{ text: string; color: string }> = [
    { text: "T. Desarrollo", color: COLOR.accent },
    { text: "T. Bugs", color: COLOR.bugAccent },
    { text: "T. Sprint", color: COLOR.foreground },
  ];
  tierLabels.forEach((label, idx) => {
    writeSubLabel(firstTierStartCol + idx, label.text, label.color);
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
    buildWeekCells(ws, excelRow, breakdown, idx, weekStartColumn(idx));
  });

  buildTierCells(ws, excelRow, row.sprint, sprintTierStartColumn(weekColumns.length), {
    fill: COLOR.cardBg,
  });
}

function writeTotalLabelCells(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  label: string,
  fixedColCount: number,
): void {
  styleCell(ws.getCell(excelRow, 1), {
    fill: COLOR.totalBg,
    font: { bold: true, color: COLOR.totalFg, size: 11 },
    alignment: leftAlign(1),
    borderStyle: "medium",
    skipRightBorder: true,
  });
  ws.getCell(excelRow, 1).value = label;

  for (let c = 2; c <= fixedColCount; c++) {
    styleCell(ws.getCell(excelRow, c), {
      fill: COLOR.totalBg,
      borderStyle: "medium",
      skipRightBorder: true,
    });
  }
}

function writeTotalsRow(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  weekTotals: readonly HoursBreakdown[],
  sprintTotal: HoursBreakdown,
): void {
  writeTotalLabelCells(ws, excelRow, "Total equipo", 2);

  weekTotals.forEach((breakdown, idx) => {
    buildWeekCells(ws, excelRow, breakdown, idx, weekStartColumn(idx), "medium");
  });

  buildTierCells(ws, excelRow, sprintTotal, sprintTierStartColumn(weekTotals.length), {
    fill: COLOR.totalBg,
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
  applyHeaderRowHeights(ws);

  writeTitleRow(ws, 1, colCount, generatedAt);

  const scopeLabel = isWeekScope
    ? `Alcance: Semana ${(weekIndex ?? 0) + 1} — ${times.weeks[weekIndex ?? 0]?.dateRangeLabel ?? ""}`
    : "Alcance: Sprint completo";
  writeMetadataRows(ws, 3, colCount, {
    project,
    team,
    sprintLabel: `Sprint: ${sprintName}`,
    scopeLabel,
  });

  writeHeaderRow(ws, GROUP_HEADER_ROW, weekColumns ?? []);
  writeSubHeaderRow(ws, SUB_HEADER_ROW, weekCount);

  let dataRowIdx = 0;
  for (const row of times.rows) {
    const excelRow = DATA_START_ROW + dataRowIdx;
    ws.getRow(excelRow).height = 32;
    const memberInfo = lookupMemberOrPlaceholder(memberRoles, row.assignee);
    writePersonRow(ws, excelRow, row, memberInfo, weekColumns ?? []);
    dataRowIdx++;
  }

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

  // El diálogo permite seleccionar en cualquier orden, pero el Excel siempre
  // emite los sprints cronológicamente para que el lector los recorra de forma
  // natural. Los huecos entre sprints (no consecutivos) no se rellenan: sólo
  // aparecen los sprints efectivamente seleccionados.
  const sortedSprints = [...sprints].sort((a, b) =>
    (a.startDate ?? "").localeCompare(b.startDate ?? ""),
  );

  const weekCount = sortedSprints.reduce(
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
    aggregates: aggregateUsersAcrossSprints(
      sortedSprints,
      sortedSprints.length,
      memberRoles,
    ),
    sprints: sortedSprints.map((sprint) => ({
      sprintName: sprint.sprintName,
      startDate: sprint.startDate,
      finishDate: sprint.finishDate,
    })),
  });

  // Layout: Sprint | Persona | Rol | (3 sub-cols × weekCount) | (3 tier cols)
  ws.columns = buildColumnLayout(weekCount, [
    SPRINT_COL_WIDTH,
    PERSONA_COL_WIDTH,
    ROL_COL_WIDTH,
  ]);
  applyHeaderRowHeights(ws);

  const totalCols = combinedTierStartColumn(weekCount) + SPRINT_TIER_COLS - 1;

  writeCombinedTitleRow(ws, 1, totalCols, generatedAt, sortedSprints.length);

  writeMetadataRows(ws, 3, totalCols, {
    project,
    team,
    sprintLabel: combinedSprintLabel(sortedSprints.map((s) => s.sprintName)),
    scopeLabel:
      sortedSprints.length === 1 ? "Alcance: Sprint completo" : "Alcance: Combinado",
  });

  writeCombinedHeaderRow(ws, GROUP_HEADER_ROW, weekCount);
  writeSubHeaderRow(ws, SUB_HEADER_ROW, weekCount, 3);

  // Datos: una fila por (sprint, persona), agrupados por sprint.
  let dataRowIdx = 0;
  // Acumulamos subtotales por sprint para luego componer el total general.
  const sprintGroupTotals: Array<{
    weekTotals: HoursBreakdown[];
    sprintTotal: HoursBreakdown;
  }> = [];

  for (const sprintEntry of sortedSprints) {
    const sprintName = sprintEntry.sprintName;
    const sprintWeeks = sprintEntry.times.weeks;

    for (const personRow of sprintEntry.times.rows) {
      const excelRow = DATA_START_ROW + dataRowIdx;
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

    const subtotalRow = DATA_START_ROW + dataRowIdx;
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

  if (sortedSprints.length > 0) {
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
    const totalRow = DATA_START_ROW + dataRowIdx;
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

function combinedSprintLabel(sprintNames: readonly string[]): string {
  return sprintNames.length === 1
    ? `Sprint: ${sprintNames[0] ?? ""}`
    : `Sprints (${sprintNames.length}): ${sprintNames.join(", ")}`;
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

function writeCombinedHeaderRow(
  ws: ExcelJS.Worksheet,
  row: number,
  weekCount: number,
): void {
  writeFixedHeaderCells(ws, row, ["Sprint", "Persona", "Rol"], {
    skipLastRightBorder: false,
  });

  for (let idx = 0; idx < weekCount; idx++) {
    writeGroupHeaderCell(ws, row, combinedWeekStartColumn(idx), `Semana ${idx + 1}`, {
      font: GROUP_HEADER_FONT,
    });
  }

  writeTierHeaderCell(ws, row, combinedTierStartColumn(weekCount));
}

function writeCombinedPersonRow(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  sprintName: string,
  row: { assignee: string; weeks: readonly HoursBreakdown[]; sprint: HoursBreakdown },
  memberInfo: MemberInfo,
  weekCount: number,
): void {
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
    buildWeekCells(ws, excelRow, breakdown, idx, combinedWeekStartColumn(idx));
  }

  buildTierCells(ws, excelRow, row.sprint, combinedTierStartColumn(weekCount), {
    fill: COLOR.cardBg,
  });
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

  for (let c = 2; c <= 3; c++) {
    styleCell(ws.getCell(excelRow, c), {
      fill: COLOR.subHeaderBg,
      borderStyle: "medium",
      skipRightBorder: true,
    });
  }

  for (let idx = 0; idx < weekCount; idx++) {
    const breakdown = weekTotals[idx] ?? EMPTY_HOURS_BREAKDOWN;
    buildWeekCells(ws, excelRow, breakdown, idx, combinedWeekStartColumn(idx), "medium");
  }

  buildTierCells(ws, excelRow, sprintTotal, combinedTierStartColumn(weekCount), {
    fill: COLOR.subHeaderBg,
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
  writeTotalLabelCells(ws, excelRow, "Total general", 3);

  for (let idx = 0; idx < weekCount; idx++) {
    const breakdown = weekTotals[idx] ?? EMPTY_HOURS_BREAKDOWN;
    buildWeekCells(ws, excelRow, breakdown, idx, combinedWeekStartColumn(idx), "medium");
  }

  buildTierCells(ws, excelRow, sprintTotal, combinedTierStartColumn(weekCount), {
    fill: COLOR.totalBg,
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

type SummarySprintMeta = {
  name: string;
  /** Rango ya formateado (p. ej. "10 mar – 23 mar"). `null` si faltan fechas. */
  dateRangeLabel: string | null;
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

function writeSummarySheet(
  workbook: ExcelJS.Workbook,
  input: WriteSummarySheetInput,
): void {
  const { project, team, generatedAt, aggregates, sprints } = input;
  const sprintsMeta = sprints.map(resolveSprintMeta);
  const sprintCount = sprintsMeta.length;

  const ws = workbook.addWorksheet("Resumen");
  // Layout: Persona | Rol | (3 sub-cols × sprintCount) | (3 tier cols)
  ws.columns = buildColumnLayout(sprintCount);
  applyHeaderRowHeights(ws, 36);

  const totalCols = totalColumnCount(sprintCount);

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
    sprintLabel: "Sprint: Resumen combinado",
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
    const excelRow = DATA_START_ROW + dataRowIdx;
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
  const totalRow = DATA_START_ROW + dataRowIdx;
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
  writeFixedHeaderCells(ws, row, ["Persona", "Rol"]);

  sprintsMeta.forEach((sprint, idx) => {
    const value = sprint.dateRangeLabel
      ? twoLineHeaderValue(sprint.name, sprint.dateRangeLabel)
      : sprint.name;
    writeGroupHeaderCell(ws, row, weekStartColumn(idx), value, { wrap: true });
  });

  writeTierHeaderCell(ws, row, sprintTierStartColumn(sprintsMeta.length));
}
