import { describe, expect, it } from "vitest";

import { validateNewAssignment } from "@/lib/assignments/validate-new-assignment";
import type { PersonProjectAssignmentRow } from "@/lib/db";

const baseRow = (
  overrides: Partial<PersonProjectAssignmentRow>,
): PersonProjectAssignmentRow => ({
  id: overrides.id ?? "row-1",
  personAdoId: overrides.personAdoId ?? "person-1",
  personDisplayName: overrides.personDisplayName ?? "Person",
  projectId: overrides.projectId ?? "project-1",
  projectName: overrides.projectName ?? "Project",
  teamId: overrides.teamId ?? null,
  teamName: overrides.teamName ?? null,
  roleId: overrides.roleId ?? null,
  assignmentPct: overrides.assignmentPct ?? 50,
  assignedMonth: overrides.assignedMonth ?? null,
  validFrom: overrides.validFrom ?? new Date("2026-07-01T00:00:00Z"),
  validTo: overrides.validTo ?? null,
  createdByUserId: overrides.createdByUserId ?? "user-1",
  createdAt: overrides.createdAt ?? new Date(),
});

describe("validateNewAssignment", () => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const futureStart = new Date(today);
  futureStart.setUTCDate(futureStart.getUTCDate() + 7);

  it("aprueba cuando no hay solapamiento ni tope", () => {
    const result = validateNewAssignment({
      candidate: {
        projectId: "project-1",
        teamId: null,
        validFrom: futureStart,
        validTo: null,
        assignmentPct: 50,
      },
      overlapping: [],
    });
    expect(result.ok).toBe(true);
  });

  it("rechaza por solapamiento en mismo proyecto+equipo", () => {
    const conflicting = baseRow({
      id: "existing",
      projectId: "project-1",
      teamId: "team-1",
      assignmentPct: 100,
      validFrom: new Date(today),
      validTo: null,
    });
    const result = validateNewAssignment({
      candidate: {
        projectId: "project-1",
        teamId: "team-1",
        validFrom: futureStart,
        validTo: null,
        assignmentPct: 100,
      },
      overlapping: [conflicting],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("overlapSameProject");
    }
  });

  it("permite varios equipos en el mismo proyecto para la misma persona", () => {
    const teamA = baseRow({
      id: "a",
      projectId: "project-1",
      teamId: "team-a",
      assignmentPct: 50,
      validFrom: new Date(today),
      validTo: null,
    });
    const result = validateNewAssignment({
      candidate: {
        projectId: "project-1",
        teamId: "team-b",
        validFrom: futureStart,
        validTo: null,
        assignmentPct: 50,
      },
      overlapping: [teamA],
    });
    expect(result.ok).toBe(true);
  });

  it("rechaza cuando suma total de asignaciones vigentes supera 100", () => {
    const a = baseRow({
      id: "a",
      projectId: "project-a",
      teamId: "team-a",
      assignmentPct: 60,
      validFrom: new Date(today),
      validTo: null,
    });
    const b = baseRow({
      id: "b",
      projectId: "project-b",
      teamId: "team-b",
      assignmentPct: 50,
      validFrom: new Date(today),
      validTo: null,
    });
    const result = validateNewAssignment({
      candidate: {
        projectId: "project-c",
        teamId: "team-c",
        validFrom: futureStart,
        validTo: null,
        assignmentPct: 10,
      },
      overlapping: [a, b],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("over100");
      expect(result.currentTotal).toBe(110);
    }
  });

  it("permite el caso exacto de 100% (CA-26)", () => {
    const a = baseRow({
      id: "a",
      projectId: "project-a",
      teamId: "team-a",
      assignmentPct: 60,
      validFrom: new Date(today),
      validTo: null,
    });
    const result = validateNewAssignment({
      candidate: {
        projectId: "project-b",
        teamId: "team-b",
        validFrom: futureStart,
        validTo: null,
        assignmentPct: 40,
      },
      overlapping: [a],
    });
    expect(result.ok).toBe(true);
  });

  it("permite inicio anterior a hoy (HU-01 sin restricción de retroactividad)", () => {
    const past = new Date(today);
    past.setUTCDate(past.getUTCDate() - 1);
    const result = validateNewAssignment({
      candidate: {
        projectId: "project-x",
        teamId: null,
        validFrom: past,
        validTo: null,
        assignmentPct: 50,
      },
      overlapping: [],
    });
    expect(result.ok).toBe(true);
  });

  it("rechaza fin anterior al inicio", () => {
    const start = new Date(futureStart);
    const earlier = new Date(start);
    earlier.setUTCDate(earlier.getUTCDate() - 1);
    const result = validateNewAssignment({
      candidate: {
        projectId: "project-y",
        teamId: null,
        validFrom: start,
        validTo: earlier,
        assignmentPct: 50,
      },
      overlapping: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("endBeforeStart");
  });

  it("ignora solapamientos en proyectos distintos si las fechas no se cruzan", () => {
    const earlier = baseRow({
      id: "earlier",
      projectId: "project-a",
      teamId: "team-a",
      assignmentPct: 100,
      validFrom: new Date("2025-01-01T00:00:00Z"),
      validTo: new Date("2025-06-30T00:00:00Z"),
    });
    const result = validateNewAssignment({
      candidate: {
        projectId: "project-b",
        teamId: "team-b",
        validFrom: futureStart,
        validTo: null,
        assignmentPct: 50,
      },
      overlapping: [earlier],
    });
    expect(result.ok).toBe(true);
  });
});
