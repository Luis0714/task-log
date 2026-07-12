import { describe, expect, it } from "vitest";

import { buildHoursReport } from "@/lib/reports/hours/build-hours-report";
import {
  fakeAuth,
  makeAssignment,
  makeBug,
  makeFakeAssignmentRepo,
  makeFakeNewsStoriesRepo,
  makeScope,
  makeTask,
} from "@/lib/reports/hours/build-hours-report.fixtures";
import type { AdoWorkItemOption } from "@/lib/azure-devops/work-items";
import type { UserStorySnapshot } from "@/lib/azure-devops/fetch-user-stories-by-ids";

function fixedWorkingDays(fromIso: string, toIso: string): string[] {
  const start = new Date(`${fromIso}T00:00:00Z`);
  const end = new Date(`${toIso}T00:00:00Z`);
  const result: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      result.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

const fixedNow = () => new Date("2026-07-01T00:00:00Z");

describe("buildHoursReport", () => {
  it("caso del cliente: 60 dev + 20 bugs + 8 news = 88 → 100% verde (CA-26)", async () => {
    const devTasks: AdoWorkItemOption[] = Array.from({ length: 8 }, (_, i) =>
      makeTask({ id: i + 1, loggedHours: 7.5, parentId: 500 + i }),
    );
    const bugTasks: AdoWorkItemOption[] = Array.from({ length: 5 }, (_, i) =>
      makeBug({ id: 200 + i, loggedHours: 4 }),
    );
    const newsTasks: AdoWorkItemOption[] = [
      makeTask({ id: 300, loggedHours: 4, parentId: 100 }),
      makeTask({ id: 301, loggedHours: 4, parentId: 101 }),
    ];

    const repo = makeFakeAssignmentRepo([
      makeAssignment({ assignmentPct: 50 }),
    ]);
    const newsStories = makeFakeNewsStoriesRepo([
      { projectId: "Proyecto A", teamId: "Backend", workItemId: 100, workItemTitleSnapshot: "Novedad 1" },
      { projectId: "Proyecto A", teamId: "Backend", workItemId: 101, workItemTitleSnapshot: "Novedad 2" },
      { projectId: "Proyecto A", teamId: "Backend", workItemId: 102, workItemTitleSnapshot: "Novedad 3" },
    ]);

    const fetchUserStories = async (): Promise<UserStorySnapshot[]> => [
      { id: 100, title: "Novedad 1", state: "Active", type: "Feature" },
      { id: 101, title: "Novedad 2", state: "Active", type: "Feature" },
      { id: 102, title: "Novedad 3", state: "Active", type: "Feature" },
    ];

    const result = await buildHoursReport(
      {
        scopes: [makeScope()],
        period: { kind: "month", monthKey: "2026-06" },
      },
      {
        auth: fakeAuth,
        assignmentRepo: repo,
        newsStoriesRepo: newsStories,
        listTasks: async () => [...devTasks, ...newsTasks],
        listBugs: async () => bugTasks,
        fetchUserStories: fetchUserStories as never,
        listWorkingDays: async () => fixedWorkingDays("2026-06-01", "2026-06-30"),
        now: fixedNow,
      },
    );

    expect(result.rows.length).toBe(1);
    const row = result.rows[0];
    expect(row.developmentHours).toBe(60);
    expect(row.bugHours).toBe(20);
    expect(row.newsHours).toBe(8);
    expect(row.totalHours).toBe(88);
    expect(row.expectedHours).toBeGreaterThan(0);
    expect(row.compliancePct).toBeGreaterThanOrEqual(95);
    expect(row.semaforo).toBe("verde");
    expect(result.alerts.find((a) => a.kind === "news_not_configured")).toBeUndefined();
  });

  it("solo salen las personas del roster/excepciones, no los asignados de tasks ajenos", async () => {
    // "Ana Gómez" es miembro del equipo; "Externo X" reportó trabajo pero no
    // está en el roster ni tiene excepción → NO debe aparecer (paridad con
    // la pantalla de Asignaciones, misma fuente de personas).
    const result = await buildHoursReport(
      {
        scopes: [makeScope()],
        period: { kind: "month", monthKey: "2026-06" },
      },
      {
        auth: fakeAuth,
        assignmentRepo: makeFakeAssignmentRepo([]),
        newsStoriesRepo: makeFakeNewsStoriesRepo([]),
        listTasks: async () => [
          makeTask({ id: 1, assignedTo: "Ana Gómez", loggedHours: 8, parentId: 500 }),
          makeTask({ id: 2, assignedTo: "Externo X", loggedHours: 8, parentId: 501 }),
        ],
        listBugs: async () => [],
        fetchUserStories: (async () => []) as never,
        listWorkingDays: async () => fixedWorkingDays("2026-06-01", "2026-06-30"),
        loadTeamMembers: async () => [
          { personAdoId: "user-ana", personDisplayName: "Ana Gómez" },
        ],
        now: fixedNow,
      },
    );

    expect(result.rows.map((r) => r.personDisplayName)).toEqual(["Ana Gómez"]);
    expect(result.rows[0].assignmentPct).toEqual({ kind: "default" });
    expect(result.rows[0].developmentHours).toBeGreaterThan(0);
    expect(result.alerts.find((a) => a.kind === "unconfigured_person")).toBeUndefined();
  });

  it("miembro del equipo sin excepción → 100% por defecto, sin alerta (CA-18)", async () => {
    const task = makeTask({ id: 1, assignedTo: "Ana Gómez", loggedHours: 8, parentId: 500 });
    const result = await buildHoursReport(
      {
        scopes: [makeScope()],
        period: { kind: "month", monthKey: "2026-06" },
      },
      {
        auth: fakeAuth,
        assignmentRepo: makeFakeAssignmentRepo([]),
        newsStoriesRepo: makeFakeNewsStoriesRepo([]),
        listTasks: async () => [task],
        listBugs: async () => [],
        fetchUserStories: (async () => []) as never,
        listWorkingDays: async () => fixedWorkingDays("2026-06-01", "2026-06-30"),
        loadTeamMembers: async () => [
          { personAdoId: "user-ana", personDisplayName: "Ana Gómez" },
        ],
        now: fixedNow,
      },
    );

    const row = result.rows.find((r) => r.personDisplayName === "Ana Gómez");
    expect(row?.assignmentPct).toEqual({ kind: "default" });
    expect(row?.expectedHours).toBeGreaterThan(0);
    expect(result.alerts.find((a) => a.kind === "unconfigured_person")).toBeUndefined();
  });

  it("excepción con nombre distinto al roster no duplica: 1 fila por adoId", async () => {
    // El roster trae "José Pérez"; la excepción en BD tiene el mismo adoId pero
    // el nombre sin tildes. Debe salir UNA sola fila (clave = personAdoId).
    const result = await buildHoursReport(
      {
        scopes: [makeScope()],
        period: { kind: "month", monthKey: "2026-06" },
      },
      {
        auth: fakeAuth,
        assignmentRepo: makeFakeAssignmentRepo([
          makeAssignment({
            personAdoId: "u1",
            personDisplayName: "Jose Perez",
            assignmentPct: 50,
          }),
        ]),
        newsStoriesRepo: makeFakeNewsStoriesRepo([]),
        listTasks: async () => [],
        listBugs: async () => [],
        fetchUserStories: (async () => []) as never,
        listWorkingDays: async () => fixedWorkingDays("2026-06-01", "2026-06-30"),
        loadTeamMembers: async () => [
          { personAdoId: "u1", personDisplayName: "José Pérez" },
        ],
        now: fixedNow,
      },
    );

    expect(result.rows.length).toBe(1);
    expect(result.rows[0].personDisplayName).toBe("José Pérez");
    expect(result.rows[0].assignmentPct).toEqual({ kind: "exception", weightedPct: 50 });
  });

  it("miembro del equipo sin trabajo reportado igual aparece (roster, CA-28)", async () => {
    const result = await buildHoursReport(
      {
        scopes: [makeScope()],
        period: { kind: "month", monthKey: "2026-06" },
      },
      {
        auth: fakeAuth,
        assignmentRepo: makeFakeAssignmentRepo([]),
        newsStoriesRepo: makeFakeNewsStoriesRepo([]),
        listTasks: async () => [],
        listBugs: async () => [],
        fetchUserStories: (async () => []) as never,
        listWorkingDays: async () => fixedWorkingDays("2026-06-01", "2026-06-30"),
        loadTeamMembers: async () => [
          { personAdoId: "user-ana", personDisplayName: "Ana Gómez" },
        ],
        now: fixedNow,
      },
    );

    const row = result.rows.find((r) => r.personDisplayName === "Ana Gómez");
    expect(row?.assignmentPct).toEqual({ kind: "default" });
    expect(row?.totalHours).toBe(0);
    expect(row?.compliancePct).toBe(0);
    expect(result.alerts.find((a) => a.kind === "unconfigured_person")).toBeUndefined();
  });

  it("scope sin HUs de novedad → alerta news_not_configured y 0 en newsHours", async () => {
    const result = await buildHoursReport(
      {
        scopes: [makeScope()],
        period: { kind: "month", monthKey: "2026-06" },
      },
      {
        auth: fakeAuth,
        assignmentRepo: makeFakeAssignmentRepo([makeAssignment({ assignmentPct: 100 })]),
        newsStoriesRepo: makeFakeNewsStoriesRepo([]),
        listTasks: async () => [makeTask({ id: 1, loggedHours: 8, parentId: undefined })],
        listBugs: async () => [],
        fetchUserStories: (async () => []) as never,
        listWorkingDays: async () => fixedWorkingDays("2026-06-01", "2026-06-30"),
        now: fixedNow,
      },
    );

    expect(result.alerts.find((a) => a.kind === "news_not_configured")).toBeDefined();
    expect(result.rows[0].newsHours).toBe(0);
    expect(result.rows[0].newsCount).toBe(0);
  });

  it("HU de novedad eliminada en Azure → alerta news_story_deleted", async () => {
    const newsStories = makeFakeNewsStoriesRepo([
      { projectId: "Proyecto A", teamId: "Backend", workItemId: 999, workItemTitleSnapshot: "Borrada" },
    ]);
    const fetchUserStories = async (): Promise<UserStorySnapshot[]> => [];

    const result = await buildHoursReport(
      {
        scopes: [makeScope()],
        period: { kind: "month", monthKey: "2026-06" },
      },
      {
        auth: fakeAuth,
        assignmentRepo: makeFakeAssignmentRepo([makeAssignment({ assignmentPct: 100 })]),
        newsStoriesRepo: newsStories,
        listTasks: async () => [],
        listBugs: async () => [],
        fetchUserStories: fetchUserStories as never,
        listWorkingDays: async () => fixedWorkingDays("2026-06-01", "2026-06-30"),
        now: fixedNow,
      },
    );

    expect(result.alerts.find((a) => a.kind === "news_story_deleted")).toBeDefined();
  });

  it("festivos caídos → propaga el error (el caller bloquea el reporte)", async () => {
    await expect(
      buildHoursReport(
        {
          scopes: [makeScope()],
          period: { kind: "month", monthKey: "2026-06" },
        },
        {
          auth: fakeAuth,
          assignmentRepo: makeFakeAssignmentRepo([]),
          newsStoriesRepo: makeFakeNewsStoriesRepo([]),
          listTasks: async () => [],
          listBugs: async () => [],
          fetchUserStories: (async () => []) as never,
          listWorkingDays: async () => {
            throw new Error("Nager.Date caído");
          },
          now: fixedNow,
        },
      ),
    ).rejects.toThrow("Nager.Date caído");
  });
});