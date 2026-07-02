import "server-only";

import ExcelJS from "exceljs";

import { totalHoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import { lookupMember, type MemberInfo } from "@/lib/reports/excel/member-info";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";

// ── App brand colors (light theme) ───────────────────────────────────────────
const COLOR = {
  primary: "FF8B5CF6",       // --brand-mark (morado)
  primaryFg: "FFFFFFFF",    // white sobre morado
  secondary: "FFE5E7FF",    // --secondary
  secondaryFg: "FF123187",  // --secondary-foreground
  card: "FFF8F8FA",         // --card
  muted: "FFE3E3E8",        // --muted
  mutedFg: "FF45455A",      // --muted-foreground
  foreground: "FF101013",   // --foreground
  border: "FFC8C8D0",       // --border
  white: "FFFFFFFF",
  totalBg: "FFEDE9FE",      // violeta muy claro para la fila total
  totalFg: "FF4C1D95",      // violeta oscuro para texto del total
} as const;

type BorderStyle = "thin" | "medium";

function border(style: BorderStyle = "thin"): ExcelJS.Border {
  return { style, color: { argb: COLOR.border } };
}

function allBorders(style: BorderStyle = "thin"): Partial<ExcelJS.Borders> {
  const b = border(style);
  return { top: b, left: b, bottom: b, right: b };
}

function applyFill(cell: ExcelJS.Cell, argb: string) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function applyFont(
  cell: ExcelJS.Cell,
  opts: { bold?: boolean; color?: string; size?: number },
) {
  cell.font = {
    name: "Calibri",
    bold: opts.bold ?? false,
    color: opts.color ? { argb: opts.color } : undefined,
    size: opts.size ?? 11,
  };
}

function centerAlign(cell: ExcelJS.Cell) {
  cell.alignment = { horizontal: "center", vertical: "middle", wrapText: false };
}

function leftAlign(cell: ExcelJS.Cell) {
  cell.alignment = { horizontal: "left", vertical: "middle", wrapText: false };
}

function formatHours(value: number): number {
  return Math.round(value * 10) / 10;
}

export type BuildSprintTimesExcelInput = {
  sprintName: string;
  project: string;
  team: string;
  times: SprintTimesMetrics;
  /** displayName → { role, email } */
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

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NeosView";
  workbook.created = generatedAt;

  const ws = workbook.addWorksheet("Tiempos registrados", {
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
  });

  // ── Row heights ────────────────────────────────────────────────────────────
  ws.getRow(1).height = 36;
  ws.getRow(2).height = 18;
  ws.getRow(3).height = 18;
  ws.getRow(4).height = 18;
  ws.getRow(5).height = 8;

  // ── Build column definitions ───────────────────────────────────────────────
  const weekColumns = isWeekScope ? [times.weeks[weekIndex]] : times.weeks;
  const totalColumnCount = 3 + (weekColumns?.length ?? 0) + 1; // name + email + role + weeks + total

  const columns: Partial<ExcelJS.Column>[] = [
    { key: "name", width: 28 },
    { key: "email", width: 30 },
    { key: "role", width: 18 },
    ...(weekColumns ?? []).map((_, i) => ({
      key: `week${i}`,
      width: 16,
    })),
    { key: "total", width: 14 },
  ];
  ws.columns = columns;

  // ── Row 1 – Título ────────────────────────────────────────────────────────
  ws.mergeCells(1, 1, 1, totalColumnCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = "REPORTE DE TIEMPOS REGISTRADOS";
  applyFill(titleCell, COLOR.primary);
  applyFont(titleCell, { bold: true, color: COLOR.white, size: 14 });
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  // ── Row 2 – Fecha de generación ───────────────────────────────────────────
  ws.mergeCells(2, 1, 2, totalColumnCount);
  const subtitleCell = ws.getCell(2, 1);
  subtitleCell.value = `Generado por NeosView · ${generatedAt.toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" })}`;
  applyFill(subtitleCell, COLOR.secondary);
  applyFont(subtitleCell, { color: COLOR.secondaryFg, size: 9 });
  subtitleCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };

  // ── Row 3 – Project / Team ─────────────────────────────────────────────────
  const midCol = Math.ceil(totalColumnCount / 2);

  ws.mergeCells(3, 1, 3, midCol);
  const projectCell = ws.getCell(3, 1);
  projectCell.value = `Proyecto: ${project}`;
  applyFill(projectCell, COLOR.card);
  applyFont(projectCell, { size: 10, color: COLOR.foreground });
  leftAlign(projectCell);

  ws.mergeCells(3, midCol + 1, 3, totalColumnCount);
  const teamCell = ws.getCell(3, midCol + 1);
  teamCell.value = `Equipo: ${team}`;
  applyFill(teamCell, COLOR.card);
  applyFont(teamCell, { size: 10, color: COLOR.foreground });
  leftAlign(teamCell);

  // ── Row 4 – Sprint / Scope ────────────────────────────────────────────────
  ws.mergeCells(4, 1, 4, midCol);
  const sprintCell = ws.getCell(4, 1);
  sprintCell.value = `Sprint: ${sprintName}`;
  applyFill(sprintCell, COLOR.card);
  applyFont(sprintCell, { size: 10, color: COLOR.foreground });
  leftAlign(sprintCell);

  ws.mergeCells(4, midCol + 1, 4, totalColumnCount);
  const scopeCell = ws.getCell(4, midCol + 1);
  const scopeLabel = isWeekScope
    ? `Semana: ${times.weeks[weekIndex]?.label ?? `Semana ${weekIndex + 1}`}`
    : "Alcance: Sprint completo";
  scopeCell.value = scopeLabel;
  applyFill(scopeCell, COLOR.card);
  applyFont(scopeCell, { size: 10, color: COLOR.foreground });
  leftAlign(scopeCell);

  // ── Row 5 – Spacer ────────────────────────────────────────────────────────
  // (empty row for visual separation)

  // ── Row 6 – Column headers ────────────────────────────────────────────────
  const HEADER_ROW = 6;
  ws.getRow(HEADER_ROW).height = 26;

  const weekHeaders = isWeekScope
    ? [times.weeks[weekIndex]?.label ?? `Semana ${weekIndex + 1}`]
    : (times.weeks ?? []).map((w) => w.label);

  const headers = ["Nombre", "Correo", "Rol", ...weekHeaders, "Total (h)"];
  headers.forEach((header, colIdx) => {
    const cell = ws.getCell(HEADER_ROW, colIdx + 1);
    cell.value = header;
    applyFill(cell, COLOR.primary);
    applyFont(cell, { bold: true, color: COLOR.primaryFg, size: 11 });
    centerAlign(cell);
    cell.border = allBorders("thin");
  });

  // ── Data rows ──────────────────────────────────────────────────────────────
  const DATA_START_ROW = 7;
  let dataRowIdx = 0;

  for (const row of times.rows) {
    const excelRow = DATA_START_ROW + dataRowIdx;
    const isAlt = dataRowIdx % 2 === 1;
    const rowBg = isAlt ? COLOR.secondary : COLOR.white;

    const weekHours = isWeekScope
      ? [formatHours(totalHoursBreakdown(row.weeks[weekIndex] ?? { taskHours: 0, bugHours: 0 }))]
      : row.weeks.map((w) => formatHours(totalHoursBreakdown(w)));

    const totalHours = isWeekScope
      ? (weekHours[0] ?? 0)
      : formatHours(totalHoursBreakdown(row.sprint));

    const info = lookupMember(memberRoles, row.assignee);
    const values = [row.assignee, info.email, info.role, ...weekHours, totalHours];

    ws.getRow(excelRow).height = 20;
    values.forEach((value, colIdx) => {
      const cell = ws.getCell(excelRow, colIdx + 1);
      cell.value = value;
      applyFill(cell, rowBg);
      applyFont(cell, { size: 10, color: COLOR.foreground });
      cell.border = allBorders("thin");

      if (colIdx === 0) {
        leftAlign(cell);
        applyFont(cell, { bold: true, size: 10, color: COLOR.foreground });
      } else if (colIdx === 1) {
        leftAlign(cell);
        applyFont(cell, { size: 9, color: COLOR.mutedFg });
      } else if (colIdx === 2) {
        leftAlign(cell);
        applyFont(cell, { size: 10, color: COLOR.mutedFg });
      } else {
        centerAlign(cell);
        cell.numFmt = "0.0";
      }
    });

    dataRowIdx++;
  }

  // ── Total row ──────────────────────────────────────────────────────────────
  const totalRow = DATA_START_ROW + dataRowIdx;
  ws.getRow(totalRow).height = 22;

  const colWeekTotals = isWeekScope
    ? [
        formatHours(
          times.rows.reduce(
            (acc, r) => acc + totalHoursBreakdown(r.weeks[weekIndex] ?? { taskHours: 0, bugHours: 0 }),
            0,
          ),
        ),
      ]
    : times.weeks.map((_, wIdx) =>
        formatHours(
          times.rows.reduce(
            (acc, r) => acc + totalHoursBreakdown(r.weeks[wIdx] ?? { taskHours: 0, bugHours: 0 }),
            0,
          ),
        ),
      );

  const grandTotal = formatHours(
    times.rows.reduce((acc, r) => acc + totalHoursBreakdown(r.sprint), 0),
  );

  const totalValues = ["Total equipo", "", "", ...colWeekTotals, isWeekScope ? (colWeekTotals[0] ?? 0) : grandTotal];

  totalValues.forEach((value, colIdx) => {
    const cell = ws.getCell(totalRow, colIdx + 1);
    cell.value = value;
    applyFill(cell, COLOR.totalBg);
    applyFont(cell, { bold: true, color: COLOR.totalFg, size: 10 });
    cell.border = allBorders("medium");

    if (colIdx <= 2) {
      leftAlign(cell);
    } else {
      centerAlign(cell);
      cell.numFmt = "0.0";
    }
  });

  // ── Freeze header row ─────────────────────────────────────────────────────
  ws.views = [{ state: "frozen", xSplit: 0, ySplit: HEADER_ROW }];

  return workbook.xlsx.writeBuffer();
}
