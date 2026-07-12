import "server-only";

import type ExcelJS from "exceljs";

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

export { COLOR };

export type BorderStyle = "thin" | "medium";
export type BorderSide = "top" | "right" | "bottom" | "left";

export type CellStyle = {
  fill?: string;
  font?: { bold?: boolean; italic?: boolean; color?: string; size?: number };
  alignment?: {
    horizontal: "left" | "center";
    vertical: "middle";
    wrapText?: boolean;
    indent?: number;
  };
  borderStyle?: BorderStyle;
  skipRightBorder?: boolean;
  numFmt?: string;
};

export function styleCell(cell: ExcelJS.Cell, style: CellStyle): void {
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

export function centerAlign(wrap = false): CellStyle["alignment"] {
  return { horizontal: "center", vertical: "middle", wrapText: wrap };
}

export function leftAlign(indent = 1, wrap = false): CellStyle["alignment"] {
  return { horizontal: "left", vertical: "middle", wrapText: wrap, indent };
}

export const HOURS_NUMFMT = `0.0"h"`;

export function buildHoursCell(
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

export function buildPersonaCell(
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

export function buildRolCell(cell: ExcelJS.Cell, role: string): void {
  cell.value = role;
  styleCell(cell, {
    fill: COLOR.cardBg,
    font: { color: COLOR.mutedFg, size: 10 },
    alignment: leftAlign(1),
    borderStyle: "thin",
    skipRightBorder: true,
  });
}