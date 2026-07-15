import { describe, expect, it } from "vitest";

import { buildSprintTimesMetrics } from "@/lib/sprints/build-sprint-times-metrics";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

// Sprint de dos semanas: 2026-06-15 (lun) a 2026-06-26 (vie).
const SPRINT_START = "2026-06-15";
const SPRINT_FINISH = "2026-06-26";

function makeItem(overrides: Partial<AdoWorkItemOptionDto> = {}): AdoWorkItemOptionDto {
  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? "Task",
    type: overrides.type ?? "Task",
    state: overrides.state ?? "Done",
    assignedTo: overrides.assignedTo ?? "Ana Gómez",
    loggedHours: overrides.loggedHours ?? 2,
    workingDate: overrides.workingDate ?? SPRINT_START,
    ...overrides,
  };
}

describe("buildSprintTimesMetrics", () => {
  it("cuenta tasks con horas en cualquier estado, no solo Done", () => {
    const metrics = buildSprintTimesMetrics({
      tasks: [
        makeItem({ id: 1, state: "In Progress", loggedHours: 3 }),
        makeItem({ id: 2, state: "Done", loggedHours: 2 }),
      ],
      bugs: [],
      sprintStartDate: SPRINT_START,
      sprintFinishDate: SPRINT_FINISH,
    });

    const row = metrics.rows.find((r) => r.assignee === "Ana Gómez");
    expect(row?.sprint.taskHours).toBe(5);
  });

  it("horas con fecha de trabajo en fin de semana o festivo no cuentan", () => {
    const metrics = buildSprintTimesMetrics({
      tasks: [
        makeItem({ id: 1, workingDate: "2026-06-20", loggedHours: 8 }), // sábado
        makeItem({ id: 2, workingDate: "2026-06-17", loggedHours: 4 }), // festivo inyectado
        makeItem({ id: 3, workingDate: "2026-06-16", loggedHours: 1 }),
      ],
      bugs: [],
      sprintStartDate: SPRINT_START,
      sprintFinishDate: SPRINT_FINISH,
      nonWorkingDates: ["2026-06-17"],
    });

    const row = metrics.rows.find((r) => r.assignee === "Ana Gómez");
    expect(row?.sprint.taskHours).toBe(1);
  });

  it("separa tasks y bugs por semana y persona", () => {
    const metrics = buildSprintTimesMetrics({
      tasks: [
        makeItem({ id: 1, workingDate: "2026-06-16", loggedHours: 2 }), // semana 1
        makeItem({ id: 2, workingDate: "2026-06-23", loggedHours: 3 }), // semana 2
      ],
      bugs: [
        makeItem({ id: 3, type: "Bug", workingDate: "2026-06-16", loggedHours: 1.5 }),
      ],
      sprintStartDate: SPRINT_START,
      sprintFinishDate: SPRINT_FINISH,
    });

    expect(metrics.weeks).toHaveLength(2);
    const row = metrics.rows.find((r) => r.assignee === "Ana Gómez");
    expect(row?.weeks[0]).toEqual({ taskHours: 2, bugHours: 1.5 });
    expect(row?.weeks[1]).toEqual({ taskHours: 3, bugHours: 0 });
    expect(row?.sprint).toEqual({ taskHours: 5, bugHours: 1.5 });
  });

  it("una persona del roster sin horas igual aparece con ceros", () => {
    const metrics = buildSprintTimesMetrics({
      tasks: [makeItem({ id: 1 })],
      bugs: [],
      sprintStartDate: SPRINT_START,
      sprintFinishDate: SPRINT_FINISH,
      assigneeRoster: [
        { id: "m1", displayName: "Ana Gómez" },
        { id: "m2", displayName: "Beto Ruiz" },
      ],
    });

    const beto = metrics.rows.find((r) => r.assignee === "Beto Ruiz");
    expect(beto?.sprint).toEqual({ taskHours: 0, bugHours: 0 });
  });

  it("cuando hay roster, las filas se limitan EXACTAMENTE al roster (sin merge con asignados del sprint)", () => {
    // El roster tiene Ana y Beto. Hay una task asignada a "Carlos" que no está
    // en el roster (p. ej. persona dada de baja con tareas registradas). Con
    // roster presente, NO debe aparecer fila de Carlos: la fuente única es
    // el roster, igual que el reporte por período y Asignaciones.
    const metrics = buildSprintTimesMetrics({
      tasks: [makeItem({ id: 1, assignedTo: "Carlos", loggedHours: 8 })],
      bugs: [],
      sprintStartDate: SPRINT_START,
      sprintFinishDate: SPRINT_FINISH,
      assigneeRoster: [
        { id: "m1", displayName: "Ana Gómez" },
        { id: "m2", displayName: "Beto Ruiz" },
      ],
    });

    expect(metrics.rows.map((r) => r.assignee).sort()).toEqual([
      "Ana Gómez",
      "Beto Ruiz",
    ]);
    expect(metrics.rows.find((r) => r.assignee === "Carlos")).toBeUndefined();
  });

  it("cuando hay roster, no se agrega la fila 'Sin asignar' aunque haya items sin assignedTo", () => {
    // Hay un bug sin assignedTo. Con roster presente NO debe generarse la
    // fila sintética "Sin asignar" para mantener consistencia con el reporte
    // por período y Asignaciones.
    const metrics = buildSprintTimesMetrics({
      tasks: [makeItem({ id: 1, assignedTo: "Ana Gómez", loggedHours: 4 })],
      bugs: [makeItem({ id: 2, type: "Bug", assignedTo: "", loggedHours: 2 })],
      sprintStartDate: SPRINT_START,
      sprintFinishDate: SPRINT_FINISH,
      assigneeRoster: [
        { id: "m1", displayName: "Ana Gómez" },
        { id: "m2", displayName: "Beto Ruiz" },
      ],
    });

    expect(metrics.rows.map((r) => r.assignee).sort()).toEqual([
      "Ana Gómez",
      "Beto Ruiz",
    ]);
    expect(
      metrics.rows.find((r) => r.assignee === "Sin asignar"),
    ).toBeUndefined();
  });
});
