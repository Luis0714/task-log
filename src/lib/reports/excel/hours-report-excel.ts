import "server-only";

import ExcelJS from "exceljs";

import {
  buildHoursCell,
  buildPersonaCell,
  buildRolCell,
  centerAlign,
  COLOR,
  leftAlign,
  styleCell,
} from "@/lib/reports/excel/excel-styles";
import type {
  HoursReportResult,
  HoursReportRow,
  SemaforoLevel,
} from "@/lib/reports/hours/hours-report-types";

const COL_WIDTHS = [28, 24, 28, 16, 12, 14, 14, 14, 14, 14, 16, 56, 16] as const;
const HEADER_LABELS = [
  "Proyecto",
  "Equipo",
  "Usuario",
  "% Asignación",
  "Días hábiles",
  "Horas esperadas",
  "Horas desarrollo",
  "Horas bugs",
  "Horas novedades",
  "Horas totales",
  "Cant. novedades",
  "Detalle de novedades",
  "% Cumplimiento",
] as const;

const SEMAFORO_FILLS: Record<SemaforoLevel, string> = {
  verde: "FFD1FAE5",
  amarillo: "FFFEF3C7",
  rojo: "FFFECACA",
};

const SEMAFORO_FG: Record<SemaforoLevel, string> = {
  verde: "FF065F46",
  amarillo: "FF92400E",
  rojo: "FF991B1B",
};

export type BuildHoursReportExcelInput = {
  projectNames: readonly string[];
  periodLabel: string;
  result: HoursReportResult;
  memberRoles?: ReadonlyMap<string, { role: string; email: string }>;
};

export async function buildHoursReportExcel(
  input: BuildHoursReportExcelInput,
): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "NeosView";
  workbook.created = new Date();
  const ws = workbook.addWorksheet("Reporte de horas");

  ws.columns = COL_WIDTHS.map((width) => ({ width }));
  const memberRoles = input.memberRoles ?? new Map();

  writeTitleRow(ws, input);
  writeHeaderRow(ws, HEADER_LABELS.length);

  let rowIdx = 5;
  for (const row of input.result.rows) {
    writeDataRow(ws, rowIdx, row, memberRoles);
    rowIdx += 1;
  }

  return workbook.xlsx.writeBuffer();
}

export function buildHoursReportFilename(
  projectNames: readonly string[],
  periodLabel: string,
): string {
  const slug = resolveProjectSlug(projectNames);
  return `reporte-horas-${slug}-${slugify(periodLabel)}.xlsx`;
}

function resolveProjectSlug(projectNames: readonly string[]): string {
  if (projectNames.length === 0) return "sin-proyectos";
  if (projectNames.length === 1) return slugify(projectNames[0]);
  if (projectNames.length <= 3) return projectNames.map(slugify).join("-");
  return `${projectNames.length}-proyectos`;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function writeTitleRow(ws: ExcelJS.Worksheet, input: BuildHoursReportExcelInput): void {
  const lastCol = HEADER_LABELS.length;
  ws.mergeCells(1, 1, 1, lastCol);
  const title = ws.getCell(1, 1);
  title.value = "REPORTE DE HORAS POR PERÍODO";
  styleCell(title, {
    fill: COLOR.headerBg,
    font: { bold: true, color: COLOR.headerFg, size: 14 },
    alignment: centerAlign(),
  });
  ws.getRow(1).height = 36;

  ws.mergeCells(2, 1, 2, lastCol);
  const subtitle = ws.getCell(2, 1);
  const projectsLabel =
    input.projectNames.length === 0
      ? "Sin proyectos"
      : input.projectNames.join(", ");
  const generatedAt = new Date(input.result.generatedAt).toLocaleString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  subtitle.value = `Periodo: ${input.periodLabel} · Proyectos: ${projectsLabel} · Generado por NeosView · ${generatedAt}`;
  styleCell(subtitle, {
    fill: COLOR.subHeaderBg,
    font: { color: COLOR.subHeaderFg, size: 10, italic: true },
    alignment: leftAlign(1),
  });
  ws.getRow(2).height = 22;

  ws.getRow(3).height = 8;
  ws.getRow(4).height = 22;
}

function writeHeaderRow(ws: ExcelJS.Worksheet, colCount: number): void {
  for (let c = 1; c <= colCount; c++) {
    styleCell(ws.getCell(4, c), {
      fill: COLOR.subHeaderBg,
      font: { bold: true, color: COLOR.subHeaderFg, size: 11 },
      alignment: centerAlign(true),
      borderStyle: "thin",
    });
    ws.getCell(4, c).value = HEADER_LABELS[c - 1];
  }
}

function writeDataRow(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  row: HoursReportRow,
  memberRoles: ReadonlyMap<string, { role: string; email: string }>,
): void {
  ws.getRow(excelRow).height = 32;

  styleCell(ws.getCell(excelRow, 1), {
    fill: COLOR.cardBg,
    alignment: leftAlign(1),
    borderStyle: "thin",
    skipRightBorder: true,
  });
  ws.getCell(excelRow, 1).value = row.projectName;

  styleCell(ws.getCell(excelRow, 2), {
    fill: COLOR.cardBg,
    alignment: leftAlign(1),
    borderStyle: "thin",
    skipRightBorder: true,
  });
  ws.getCell(excelRow, 2).value = row.teamName ?? "—";

  const memberInfo = memberRoles.get(row.personDisplayName);
  buildPersonaCell(ws.getCell(excelRow, 3), row.personDisplayName, memberInfo?.email ?? "");
  buildRolCell(ws.getCell(excelRow, 4), formatAssignmentPct(row));

  buildNumericCell(ws, excelRow, 5, row.workingDays);
  buildNumericCell(ws, excelRow, 6, row.expectedHours);
  buildNumericCell(ws, excelRow, 7, row.developmentHours);
  buildNumericCell(ws, excelRow, 8, row.bugHours);
  buildNumericCell(ws, excelRow, 9, row.newsHours);
  buildNumericCell(ws, excelRow, 10, row.totalHours);

  styleCell(ws.getCell(excelRow, 11), {
    fill: COLOR.cardBg,
    alignment: centerAlign(),
    borderStyle: "thin",
    skipRightBorder: true,
    numFmt: "0",
  });
  ws.getCell(excelRow, 11).value = row.newsCount;

  styleCell(ws.getCell(excelRow, 12), {
    fill: COLOR.cardBg,
    alignment: leftAlign(1, true),
    borderStyle: "thin",
    skipRightBorder: true,
  });
  ws.getCell(excelRow, 12).value = row.newsDetail;

  buildSemaforoCell(ws, excelRow, 13, row);
}

function buildNumericCell(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  col: number,
  value: number,
): void {
  buildHoursCell(ws.getCell(excelRow, col), value, {
    fill: COLOR.cardBg,
    color: COLOR.foreground,
    skipRightBorder: col < 13,
  });
}

function buildSemaforoCell(
  ws: ExcelJS.Worksheet,
  excelRow: number,
  col: number,
  row: HoursReportRow,
): void {
  const cell = ws.getCell(excelRow, col);
  if (row.semaforo === null) {
    styleCell(cell, {
      fill: COLOR.placeholderFg,
      font: { color: COLOR.mutedFg, size: 10, italic: true },
      alignment: centerAlign(),
      borderStyle: "thin",
    });
    cell.value = "Sin configurar";
    return;
  }
  styleCell(cell, {
    fill: SEMAFORO_FILLS[row.semaforo],
    font: { color: SEMAFORO_FG[row.semaforo], bold: true, size: 10 },
    alignment: centerAlign(),
    borderStyle: "thin",
  });
  cell.value = `${row.compliancePct ?? 0}%`;
  cell.numFmt = `0"%"`;
}

function formatAssignmentPct(row: HoursReportRow): string {
  if (row.assignmentPct.kind === "exception") {
    return `${row.assignmentPct.weightedPct}%`;
  }
  if (row.assignmentPct.kind === "default") {
    return "100% (por defecto)";
  }
  return "Sin configurar";
}