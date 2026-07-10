import { describe, expect, it } from "vitest";

import {
  checkOverAllocation,
  summarizeAllocation,
  type AllocationItem,
} from "@/lib/assignments/over-allocation";

const JUN = Date.parse("2026-06-01");
const JUN_END = Date.parse("2026-06-30");
const AUG = Date.parse("2026-08-01");

const item = (over: Partial<AllocationItem>): AllocationItem => ({
  projectName: over.projectName ?? "Proyecto A",
  teamName: over.teamName ?? null,
  pct: over.pct ?? 50,
  fromMs: over.fromMs ?? JUN,
  toMs: over.toMs ?? null,
});

describe("summarizeAllocation", () => {
  it("solo suma asignaciones que se cruzan en el tiempo", () => {
    const items = [
      item({ projectName: "A", pct: 40, fromMs: JUN, toMs: JUN_END }),
      item({ projectName: "B", pct: 30, fromMs: AUG, toMs: null }),
    ];
    const { total, groups } = summarizeAllocation(items, {
      fromMs: JUN,
      toMs: JUN_END,
    });
    expect(total).toBe(40);
    expect(groups).toEqual([{ projectName: "A", teamName: null, pct: 40 }]);
  });

  it("agrupa por proyecto + equipo y ordena por % desc", () => {
    const items = [
      item({ projectName: "A", teamName: "Eq1", pct: 20 }),
      item({ projectName: "B", teamName: "Eq2", pct: 50 }),
      item({ projectName: "A", teamName: "Eq1", pct: 10 }),
    ];
    const { total, groups } = summarizeAllocation(items, {
      fromMs: JUN,
      toMs: null,
    });
    expect(total).toBe(80);
    expect(groups).toEqual([
      { projectName: "B", teamName: "Eq2", pct: 50 },
      { projectName: "A", teamName: "Eq1", pct: 30 },
    ]);
  });

  it("separa el mismo proyecto en equipos distintos", () => {
    const items = [
      item({ projectName: "A", teamName: "Eq1", pct: 30 }),
      item({ projectName: "A", teamName: "Eq2", pct: 25 }),
    ];
    const { groups } = summarizeAllocation(items, { fromMs: JUN, toMs: null });
    expect(groups).toHaveLength(2);
  });
});

describe("checkOverAllocation", () => {
  it("aprueba cuando la suma global no supera 100%", () => {
    const res = checkOverAllocation({
      personDisplayName: "Ana",
      others: [item({ projectName: "A", pct: 40 })],
      candidate: { fromMs: JUN, toMs: null, pct: 60 },
    });
    expect(res.ok).toBe(true);
  });

  it("bloquea con mensaje de tope completo cuando ya tiene 100% en otro proyecto", () => {
    const res = checkOverAllocation({
      personDisplayName: "Ana",
      others: [item({ projectName: "Proyecto X", pct: 100 })],
      candidate: { fromMs: JUN, toMs: null, pct: 10 },
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.available).toBe(0);
    expect(res.message).toContain("Ana");
    expect(res.message).toContain("100%");
    expect(res.message).toContain("Proyecto X");
  });

  it("bloquea con mensaje parcial indicando cuánto queda disponible", () => {
    const res = checkOverAllocation({
      personDisplayName: "Ana",
      others: [item({ projectName: "Proyecto X", pct: 70 })],
      candidate: { fromMs: JUN, toMs: null, pct: 40 },
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.total).toBe(70);
    expect(res.available).toBe(30);
    expect(res.message).toContain("70%");
    expect(res.message).toContain("30%");
    expect(res.message).toContain("Proyecto X");
  });

  it("incluye equipo y proyecto/equipo destino del candidato en el mensaje", () => {
    const res = checkOverAllocation({
      personDisplayName: "Ana",
      others: [
        item({ projectName: "Proyecto X", teamName: "Equipo D", pct: 100 }),
      ],
      candidate: {
        fromMs: JUN,
        toMs: null,
        pct: 20,
        projectName: "Proyecto Z",
        teamName: "Equipo A",
      },
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.message).toContain("Proyecto Z");
    expect(res.message).toContain("Equipo A");
    expect(res.message).toContain("Proyecto X");
    expect(res.message).toContain("Equipo D");
    // Los datos importantes quedan marcados como resaltables.
    const strongText = res.segments
      .filter((s) => s.strong)
      .map((s) => s.text);
    expect(strongText).toContain("Ana");
    expect(strongText).toContain("20%");
    expect(strongText).toContain("Proyecto Z");
    expect(strongText).toContain("Equipo A");
  });

  it("permite llegar exactamente al 100%", () => {
    const res = checkOverAllocation({
      personDisplayName: "Ana",
      others: [item({ projectName: "A", pct: 55 })],
      candidate: { fromMs: JUN, toMs: null, pct: 45 },
    });
    expect(res.ok).toBe(true);
  });
});
