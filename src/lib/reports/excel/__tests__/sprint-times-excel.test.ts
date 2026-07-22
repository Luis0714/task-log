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
        expectedHoursByWeek: [40, 32],
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
  it("incluye la sub-columna Novedades y el resumen Total horas/Esperadas/% Cumpl.", async () => {
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
    // Resumen: Total horas(11) Esperadas(12) % Cumpl.(13).
    expect(ws.getCell(6, 11).value).toBe("Resumen");
    expect(ws.getCell(7, 11).value).toBe("Total horas");
    expect(ws.getCell(7, 12).value).toBe("Esperadas");
    expect(ws.getCell(7, 13).value).toBe("% Cumpl.");

    // Fila de datos (fila 8): total horas = 28; esperadas = 72; cumplimiento = 28/72 → "38.9%".
    expect(ws.getCell(8, 11).value).toBe(28);
    expect(ws.getCell(8, 12).value).toBe(72);
    expect(String(ws.getCell(8, 13).value)).toBe("38.9%");
  });

  it("cuando se selecciona una semana, esperadas y cumplimiento usan SOLO esa semana", async () => {
    // Misma fixture que arriba: semana 1 esperadas=40, semana 2 esperadas=32.
    // El sprint completo tiene esperadas=72 y horas totales=28 → 38.9%.
    // Pero filtrado a la semana 2: esperadas=32, horas=16 → 50.0%.
    const buffer = await buildSprintTimesExcel({
      sprintName: "Sprint 1",
      project: "Proyecto",
      team: "Equipo",
      times: buildTimes(),
      memberRoles: emptyRoles,
      weekIndex: 1,
    });

    const ws = await loadWorksheet(buffer, "Tiempos registrados");

    // Resumen: solo hay 1 semana, así que las columnas son
    // Persona(1) | Rol(2) | semana(3-6) | Total horas(7) | Esperadas(8) | % Cumpl.(9).
    expect(ws.getCell(7, 7).value).toBe("Total horas");
    expect(ws.getCell(7, 8).value).toBe("Esperadas");
    expect(ws.getCell(7, 9).value).toBe("% Cumpl.");

    // Fila de datos (fila 8): total horas de la semana 2 = 16; esperadas = 32; cumplimiento = 16/32 → "50%".
    expect(ws.getCell(8, 7).value).toBe(16);
    expect(ws.getCell(8, 8).value).toBe(32);
    expect(String(ws.getCell(8, 9).value)).toBe("50%");
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

  it("ordena la hoja Resumen por % de cumplimiento descendente (mismo criterio que la tabla)", async () => {
    // Sprint 1: Ana tiene más horas pero menor cumplimiento; Beto menos horas pero mayor cumplimiento.
    // Sprint 2: ambos repiten el patrón para que los agregados multi-sprint tengan más horas.
    const sprintTimes = (overrides: {
      anaPct: number;
      anaHours: number;
      betoPct: number;
      betoHours: number;
    }): SprintTimesMetrics => ({
      weeks: [
        { label: "Semana 1", dateRangeLabel: "01 – 05", workingDaysCount: 5 },
      ],
      rows: [
        {
          assignee: "Ana",
          weeks: [
            {
              taskHours: overrides.anaHours,
              bugHours: 0,
              newsHours: 0,
            },
          ],
          sprint: {
            taskHours: overrides.anaHours,
            bugHours: 0,
            newsHours: 0,
          },
          expectedHours: 100,
          expectedHoursByWeek: [100],
          compliancePct: overrides.anaPct,
          semaforo: null,
        },
        {
          assignee: "Beto",
          weeks: [
            {
              taskHours: overrides.betoHours,
              bugHours: 0,
              newsHours: 0,
            },
          ],
          sprint: {
            taskHours: overrides.betoHours,
            bugHours: 0,
            newsHours: 0,
          },
          expectedHours: 100,
          expectedHoursByWeek: [100],
          compliancePct: overrides.betoPct,
          semaforo: null,
        },
      ],
    });

    const buffer = await buildCombinedSprintTimesExcel({
      project: "Proyecto",
      team: "Equipo",
      sprints: [
        {
          sprintName: "Sprint 1",
          startDate: "2026-03-01",
          finishDate: "2026-03-14",
          times: sprintTimes({
            anaPct: 30,
            anaHours: 30,
            betoPct: 90,
            betoHours: 90,
          }),
        },
        {
          sprintName: "Sprint 2",
          startDate: "2026-03-15",
          finishDate: "2026-03-28",
          times: sprintTimes({
            anaPct: 30,
            anaHours: 30,
            betoPct: 90,
            betoHours: 90,
          }),
        },
      ],
      memberRoles: emptyRoles,
    });

    const summary = await loadWorksheet(buffer, "Resumen");
    // Layout Resumen: Persona(1) | Rol(2) | 2 sprints × 4 sub-cols | Total horas / Esperadas / % Cumpl.
    // Persona aparece en la columna 1 de la primera fila de datos (fila 8).
    // La celda se escribe como richText, por lo que extraemos el primer segmento.
    const readFirstRichTextSegment = (
      cellValue: ExcelJS.CellValue,
    ): string => {
      if (typeof cellValue === "object" && cellValue !== null && "richText" in cellValue) {
        const first = (cellValue as { richText: Array<{ text: string }> })
          .richText[0];
        return first?.text ?? "";
      }
      return String(cellValue);
    };
    const firstPerson = readFirstRichTextSegment(summary.getCell(8, 1).value);
    const secondPerson = readFirstRichTextSegment(summary.getCell(9, 1).value);
    // Beto (90% cumplimiento) debe aparecer antes que Ana (30%).
    expect(firstPerson).toBe("Beto");
    expect(secondPerson).toBe("Ana");
  });
});
