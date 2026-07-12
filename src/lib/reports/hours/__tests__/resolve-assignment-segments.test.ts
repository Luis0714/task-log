import { describe, expect, it } from "vitest";

import { resolveAssignmentSegments } from "@/lib/reports/hours/resolve-assignment-segments";

describe("resolveAssignmentSegments", () => {
  it("sin asignaciones y sin default → vacío", () => {
    expect(
      resolveAssignmentSegments({
        assignments: [],
        periodStart: "2026-07-01",
        periodEnd: "2026-07-31",
        hasInferredDefault: false,
      }),
    ).toEqual([]);
  });

  it("sin asignaciones pero con default 100% → tramo único abierto", () => {
    expect(
      resolveAssignmentSegments({
        assignments: [],
        periodStart: "2026-07-01",
        periodEnd: "2026-07-31",
        hasInferredDefault: true,
      }),
    ).toEqual([{ pct: 100, from: "2026-07-01", to: null }]);
  });

  it("asignación vigente dentro del periodo → tramo devuelto tal cual", () => {
    const segments = resolveAssignmentSegments({
      assignments: [
        { assignmentPct: 50, validFrom: "2026-07-01", validTo: null },
      ],
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      hasInferredDefault: false,
    });
    expect(segments).toEqual([{ pct: 50, from: "2026-07-01", to: null }]);
  });

  it("asignación cerrada antes del periodo → fallback al % de la más reciente (BD rige)", () => {
    const segments = resolveAssignmentSegments({
      assignments: [
        { assignmentPct: 50, validFrom: "2026-05-01", validTo: "2026-05-31" },
      ],
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      hasInferredDefault: false,
    });
    expect(segments).toEqual([
      { pct: 50, from: "2026-07-01", to: null },
    ]);
  });

  it("asignación que inicia después del periodo → fallback al % de la más reciente (BD rige)", () => {
    const segments = resolveAssignmentSegments({
      assignments: [
        { assignmentPct: 50, validFrom: "2026-08-01", validTo: null },
      ],
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      hasInferredDefault: false,
    });
    expect(segments).toEqual([
      { pct: 50, from: "2026-07-01", to: null },
    ]);
  });

  it("varias asignaciones, ninguna se cruza con el periodo → fallback al % de la más reciente", () => {
    // Vigencias todas fuera del periodo: histórica (cerrada) + futura.
    // La asignación de BD debe regir ⇒ usamos la más reciente (la futura al 80%).
    const segments = resolveAssignmentSegments({
      assignments: [
        { assignmentPct: 50, validFrom: "2026-05-01", validTo: "2026-05-31" },
        { assignmentPct: 80, validFrom: "2026-08-15", validTo: null },
      ],
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      hasInferredDefault: false,
    });
    expect(segments).toEqual([
      { pct: 80, from: "2026-07-01", to: null },
    ]);
  });

  it("dos tramos consecutivos devueltos ordenados por fecha", () => {
    const segments = resolveAssignmentSegments({
      assignments: [
        { assignmentPct: 50, validFrom: "2026-07-15", validTo: null },
        { assignmentPct: 100, validFrom: "2026-07-01", validTo: "2026-07-14" },
      ],
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      hasInferredDefault: false,
    });
    expect(segments).toEqual([
      { pct: 100, from: "2026-07-01", to: "2026-07-14" },
      { pct: 50, from: "2026-07-15", to: null },
    ]);
  });

  it("asignación cerrada a mitad del periodo → su % rige el resto (BD rige)", () => {
    const segments = resolveAssignmentSegments({
      assignments: [
        { assignmentPct: 60, validFrom: "2026-06-15", validTo: "2026-07-15" },
      ],
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      hasInferredDefault: false,
    });
    expect(segments).toEqual([{ pct: 60, from: "2026-06-15", to: null }]);
  });

  it("asignación que inicia a mitad del periodo → su % rige desde el inicio (BD rige)", () => {
    // Caso reportado: 50% registrado el viernes de la semana filtrada dejaba
    // los días previos en 0% ⇒ 4 h esperadas en vez de 20 h.
    const segments = resolveAssignmentSegments({
      assignments: [
        { assignmentPct: 50, validFrom: "2026-07-10", validTo: null },
      ],
      periodStart: "2026-07-06",
      periodEnd: "2026-07-12",
      hasInferredDefault: false,
    });
    expect(segments).toEqual([{ pct: 50, from: "2026-07-06", to: null }]);
  });

  it("hueco entre tramos → lo cubre el % del tramo anterior", () => {
    const segments = resolveAssignmentSegments({
      assignments: [
        { assignmentPct: 100, validFrom: "2026-07-01", validTo: "2026-07-10" },
        { assignmentPct: 50, validFrom: "2026-07-20", validTo: null },
      ],
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      hasInferredDefault: false,
    });
    expect(segments).toEqual([
      { pct: 100, from: "2026-07-01", to: "2026-07-19" },
      { pct: 50, from: "2026-07-20", to: null },
    ]);
  });

  it("cambio de % dentro del periodo se conserva por tramos (CA-16)", () => {
    const segments = resolveAssignmentSegments({
      assignments: [
        { assignmentPct: 100, validFrom: "2026-06-01", validTo: "2026-07-14" },
        { assignmentPct: 50, validFrom: "2026-07-15", validTo: null },
      ],
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      hasInferredDefault: false,
    });
    expect(segments).toEqual([
      { pct: 100, from: "2026-06-01", to: "2026-07-14" },
      { pct: 50, from: "2026-07-15", to: null },
    ]);
  });
});