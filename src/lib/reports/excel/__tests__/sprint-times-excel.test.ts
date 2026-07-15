import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import {
  buildCombinedSprintTimesExcel,
  buildSprintTimesExcel,
} from "@/lib/reports/excel/sprint-times-excel";
import type { MemberInfo } from "@/lib/reports/excel/member-info";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";

function buildTimes(): SprintTimesMetrics {
  return {
    weeks: [
      { label: "Semana 1", dateRangeLabel: "01 – 05", workingDaysCount: 5 },
      { label: "Semana 2", dateRangeLabel: "08 – 11", workingDaysCount: 4 },
    ],
    rows: [
      {
        assignee: "Ana",
        weeks: [
          { taskHours: 10, bugHours: 2, newsHours: 0 },
          { taskHours: 8, bugHours: 0, newsHours: 8 },
        ],
        sprint: { taskHours: 18, bugHours: 2, newsHours: 8 },
        expectedHours: 72,
        compliancePct: 38.9,
        semaforo: "rojo",
      },
    ],
  };
}

const emptyRoles = new Map<string, MemberInfo>();

async function loadWorksheet(
  buffer: ExcelJS.Buffer,
  name: string,
): Promise<ExcelJS.Worksheet> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet(name);
  if (!worksheet) throw new Error(`Missing worksheet ${name}`);
  return worksheet;
}

describe("buildSprintTimesExcel", () => {
  it("incluye la sub-columna Novedades y el resumen Esperadas/Total horas/% Cumpl.", async () => {
    const buffer = await buildSprintTimesExcel({
      sprintName: "Sprint 1",
      project: "Proyecto",
      team: "Equipo",
      times: buildTimes(),
      memberRoles: emptyRoles,
    });

    const ws = await loadWorksheet(buffer, "Tiempos registrados");

    // Sub-cabecera (fila 7): semana 1 → Desarrollo(3) Bugs(4) Novedades(5) Total(6).
    expect(ws.getCell(7, 5).value).toBe("Novedades");
    // Resumen: Esperadas(11) Total horas(12) % Cumpl.(13).
    expect(ws.getCell(6, 11).value).toBe("Resumen");
    expect(ws.getCell(7, 11).value).toBe("Esperadas");
    expect(ws.getCell(7, 12).value).toBe("Total horas");
    expect(ws.getCell(7, 13).value).toBe("% Cumpl.");

    // Fila de datos (fila 8): esperadas = 72; cumplimiento = 28/72 → "38.9%".
    expect(ws.getCell(8, 11).value).toBe(72);
    expect(String(ws.getCell(8, 13).value)).toBe("38.9%");
  });
});

describe("buildCombinedSprintTimesExcel", () => {
  it("genera el workbook combinado con las nuevas columnas", async () => {
    const buffer = await buildCombinedSprintTimesExcel({
      project: "Proyecto",
      team: "Equipo",
      sprints: [
        {
          sprintName: "Sprint 1",
          startDate: "2026-03-01",
          finishDate: "2026-03-14",
          times: buildTimes(),
        },
        {
          sprintName: "Sprint 2",
          startDate: "2026-03-15",
          finishDate: "2026-03-28",
          times: buildTimes(),
        },
      ],
      memberRoles: emptyRoles,
    });

    const ws = await loadWorksheet(buffer, "Tiempos registrados");
    // Sprint(1) Persona(2) Rol(3) → semana 1: Dev(4) Bugs(5) Novedades(6) Total(7).
    expect(ws.getCell(7, 6).value).toBe("Novedades");
  });
});
