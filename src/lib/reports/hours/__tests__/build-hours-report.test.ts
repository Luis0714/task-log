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
import {
  NewsNotConfiguredError,
  NEWS_NOT_CONFIGURED_CODE,
} from "@/lib/reports/hours/errors";
import type { AdoWorkItemOption } from "@/lib/azure-devops/work-items";
import type { ReportedNewsDetail } from "@/lib/azure-devops/list-reported-news";

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

/** Novedad reportada (item tipo "Novedades") para inyectar en `listReportedNews`. */
function makeNovedad(overrides: Partial<ReportedNewsDetail> = {}): ReportedNewsDetail {
  return {
    id: overrides.id ?? 900,
    title: overrides.title ?? "Novedad",
    state: overrides.state ?? "Active",
    assignedTo: overrides.assignedTo ?? "Juan Pérez",
    description: overrides.description ?? null,
    // 2026-06-15 y 16 son lunes y martes → 2 días hábiles por defecto.
    fechaInicio: overrides.fechaInicio ?? "2026-06-15",
    fechaInicioHora: overrides.fechaInicioHora ?? "08:00",
    fechaFin: overrides.fechaFin ?? "2026-06-16",
    fechaFinHora: overrides.fechaFinHora ?? "17:00",
    fechaReintegro: overrides.fechaReintegro ?? null,
    fechaReintegroHora: overrides.fechaReintegroHora ?? null,
    tipoNovedad: overrides.tipoNovedad ?? "Permiso",
    parentId: overrides.parentId ?? 100,
    createdDate: overrides.createdDate ?? null,
    completedWork: overrides.completedWork ?? 8,
  };
}

const linkedHU = [
  { projectId: "Proyecto A", teamId: "Backend", workItemId: 100, workItemTitleSnapshot: "HU novedad" },
];

const fixedNow = () => new Date("2026-07-01T00:00:00Z");

describe("buildHoursReport", () => {
  it("caso del cliente: 60 dev + 20 bugs + 8 novedades = 88 → 100% verde (CA-26)", async () => {
    const devTasks: AdoWorkItemOption[] = Array.from({ length: 8 }, (_, i) =>
      makeTask({ id: i + 1, loggedHours: 7.5, parentId: 500 + i }),
    );
    const bugTasks: AdoWorkItemOption[] = Array.from({ length: 5 }, (_, i) =>
      makeBug({ id: 200 + i, loggedHours: 4 }),
    );

    const result = await buildHoursReport(
      {
        scopes: [makeScope()],
        period: { kind: "month", monthKey: "2026-06" },
      },
      {
        auth: fakeAuth,
        assignmentRepo: makeFakeAssignmentRepo([makeAssignment({ assignmentPct: 50 })]),
        newsStoriesRepo: makeFakeNewsStoriesRepo(linkedHU),
        listTasks: async () => devTasks,
        listBugs: async () => bugTasks,
        // Completed Work de la novedad = 8 h → 8 horas, 1 día.
        listReportedNews: async () => [
          makeNovedad({
            assignedTo: "Juan Pérez",
            tipoNovedad: "Feature",
            title: "Novedad 1",
            completedWork: 8,
          }),
        ],
        listWorkingDays: async () => fixedWorkingDays("2026-06-01", "2026-06-30"),
        now: fixedNow,
      },
    );

    expect(result.rows).toHaveLength(1);
    const row = result.rows[0];
    expect(row.developmentHours).toBe(60);
    expect(row.bugHours).toBe(20);
    expect(row.workedHours).toBe(80);
    expect(row.newsHours).toBe(8);
    expect(row.newsCount).toBe(1);
    expect(row.newsDetail).toBe("Feature - Novedad 1");
    expect(row.totalHours).toBe(88);
    expect(row.compliancePct).toBeGreaterThanOrEqual(95);
    expect(row.semaforo).toBe("verde");
  });

  it("horas reportadas en día no hábil (sábado) no suman (regla de días hábiles)", async () => {
    // 2026-06-20 es sábado: la task y el bug de ese día quedan fuera; solo
    // cuenta la task del lunes 2026-06-15.
    const result = await buildHoursReport(
      {
        scopes: [makeScope()],
        period: { kind: "month", monthKey: "2026-06" },
      },
      {
        auth: fakeAuth,
        assignmentRepo: makeFakeAssignmentRepo([]),
        newsStoriesRepo: makeFakeNewsStoriesRepo(linkedHU),
        listReportedNews: async () => [],
        listTasks: async () => [
          makeTask({ id: 1, loggedHours: 8, workingDate: "2026-06-15", parentId: 500 }),
          makeTask({ id: 2, loggedHours: 6, workingDate: "2026-06-20", parentId: 501 }),
        ],
        listBugs: async () => [
          makeBug({ id: 200, loggedHours: 4, workingDate: "2026-06-20" }),
        ],
        listWorkingDays: async () => fixedWorkingDays("2026-06-01", "2026-06-30"),
        loadTeamMembers: async () => [
          { personAdoId: "user-1", personDisplayName: "Juan Pérez" },
        ],
        now: fixedNow,
      },
    );

    const row = result.rows.find((r) => r.personDisplayName === "Juan Pérez");
    expect(row?.developmentHours).toBe(8);
    expect(row?.bugHours).toBe(0);
  });

  it("tasks con horas cuentan en cualquier estado, no solo Done", async () => {
    const result = await buildHoursReport(
      {
        scopes: [makeScope()],
        period: { kind: "month", monthKey: "2026-06" },
      },
      {
        auth: fakeAuth,
        assignmentRepo: makeFakeAssignmentRepo([]),
        newsStoriesRepo: makeFakeNewsStoriesRepo(linkedHU),
        listReportedNews: async () => [],
        listTasks: async () => [
          makeTask({ id: 1, loggedHours: 5, state: "In Progress", parentId: 500 }),
        ],
        listBugs: async () => [],
        listWorkingDays: async () => fixedWorkingDays("2026-06-01", "2026-06-30"),
        loadTeamMembers: async () => [
          { personAdoId: "user-1", personDisplayName: "Juan Pérez" },
        ],
        now: fixedNow,
      },
    );

    expect(result.rows[0]?.developmentHours).toBe(5);
  });

  it("novedades: horas = Completed Work, días = horas / 8", async () => {
    // Ana con dos novedades: 8 h + 4 h = 12 h → 1.5 días.
    const result = await buildHoursReport(
      {
        scopes: [makeScope()],
        period: { kind: "month", monthKey: "2026-06" },
      },
      {
        auth: fakeAuth,
        assignmentRepo: makeFakeAssignmentRepo([]),
        newsStoriesRepo: makeFakeNewsStoriesRepo(linkedHU),
        listTasks: async () => [],
        listBugs: async () => [],
        listReportedNews: async () => [
          makeNovedad({ id: 1, assignedTo: "Ana Gómez", tipoNovedad: "Permiso", title: "Cita médica", completedWork: 8 }),
          makeNovedad({ id: 2, assignedTo: "Ana Gómez", tipoNovedad: "Capacitación", title: "Scrum", completedWork: 4 }),
        ],
        listWorkingDays: async () => fixedWorkingDays("2026-06-01", "2026-06-30"),
        loadTeamMembers: async () => [
          { personAdoId: "user-ana", personDisplayName: "Ana Gómez" },
        ],
        now: fixedNow,
      },
    );

    const row = result.rows.find((r) => r.personDisplayName === "Ana Gómez");
    expect(row?.newsHours).toBe(12); // 8 + 4
    expect(row?.newsDays).toBe(1.5); // 12 / 8
    expect(row?.newsCount).toBe(2);
    expect(row?.newsDetails).toEqual(["Permiso - Cita médica", "Capacitación - Scrum"]);
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
        newsStoriesRepo: makeFakeNewsStoriesRepo(linkedHU),
        listReportedNews: async () => [],
        listTasks: async () => [
          makeTask({ id: 1, assignedTo: "Ana Gómez", loggedHours: 8, parentId: 500 }),
          makeTask({ id: 2, assignedTo: "Externo X", loggedHours: 8, parentId: 501 }),
        ],
        listBugs: async () => [],
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
        newsStoriesRepo: makeFakeNewsStoriesRepo(linkedHU),
        listReportedNews: async () => [],
        listTasks: async () => [task],
        listBugs: async () => [],
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
        newsStoriesRepo: makeFakeNewsStoriesRepo(linkedHU),
        listReportedNews: async () => [],
        listTasks: async () => [],
        listBugs: async () => [],
        listWorkingDays: async () => fixedWorkingDays("2026-06-01", "2026-06-30"),
        loadTeamMembers: async () => [
          { personAdoId: "u1", personDisplayName: "José Pérez" },
        ],
        now: fixedNow,
      },
    );

    expect(result.rows).toHaveLength(1);
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
        newsStoriesRepo: makeFakeNewsStoriesRepo(linkedHU),
        listReportedNews: async () => [],
        listTasks: async () => [],
        listBugs: async () => [],
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

  it("scope sin HUs de novedad → bloquea el reporte con NewsNotConfiguredError", async () => {
    await expect(
      buildHoursReport(
        {
          scopes: [makeScope()],
          period: { kind: "month", monthKey: "2026-06" },
        },
        {
          auth: fakeAuth,
          assignmentRepo: makeFakeAssignmentRepo([makeAssignment({ assignmentPct: 100 })]),
          newsStoriesRepo: makeFakeNewsStoriesRepo([]),
          listTasks: async () => [makeTask({ id: 1, loggedHours: 8, parentId: 500 })],
          listBugs: async () => [],
          listWorkingDays: async () => fixedWorkingDays("2026-06-01", "2026-06-30"),
          now: fixedNow,
        },
      ),
    ).rejects.toBeInstanceOf(NewsNotConfiguredError);
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
          newsStoriesRepo: makeFakeNewsStoriesRepo(linkedHU),
          listReportedNews: async () => [],
          listTasks: async () => [],
          listBugs: async () => [],
          listWorkingDays: async () => {
            throw new Error("Nager.Date caído");
          },
          now: fixedNow,
        },
      ),
    ).rejects.toThrow("Nager.Date caído");
  });

  it("persona con asignación en BD fuera del periodo → no queda 'Sin configurar' (BD rige)", async () => {
    // Caso del cliente: persona con excepción en BD cuya vigencia NO se
    // cruza con el periodo (vigencia futura). Antes del fix esto caía en
    // `expectedHours = 0` y se mostraba "Sin configurar" en % Cumplimiento.
    // Ahora la asignación de BD rige: el % de la más reciente se aplica
    // sobre todo el periodo.
    const futureAssignment = makeAssignment({
      personAdoId: "user-1",
      personDisplayName: "Juan Pérez",
      assignmentPct: 50,
      // Vigencia futura: empieza agosto, fuera del periodo de junio.
      validFrom: new Date("2026-08-01"),
      validTo: null,
    });

    const result = await buildHoursReport(
      {
        scopes: [makeScope()],
        period: { kind: "month", monthKey: "2026-06" },
      },
      {
        auth: fakeAuth,
        assignmentRepo: makeFakeAssignmentRepo([futureAssignment]),
        newsStoriesRepo: makeFakeNewsStoriesRepo(linkedHU),
        listReportedNews: async () => [],
        listTasks: async () => [
          makeTask({ id: 1, loggedHours: 80, parentId: 500 }),
        ],
        listBugs: async () => [],
        listWorkingDays: async () => fixedWorkingDays("2026-06-01", "2026-06-30"),
        now: fixedNow,
      },
    );

    const row = result.rows[0];
    // % Cumplimiento debe estar calculado, NO null (no "Sin configurar").
    expect(row.compliancePct).not.toBeNull();
    expect(row.semaforo).not.toBeNull();
    expect(row.expectedHours).toBeGreaterThan(0);
    // % Asignación refleja la excepción de BD.
    expect(row.assignmentPct).toEqual({ kind: "exception", weightedPct: 50 });
  });

  it("NewsNotConfiguredError expone el código estable para la UI", () => {
    const error = new NewsNotConfiguredError();
    expect(error.code).toBe(NEWS_NOT_CONFIGURED_CODE);
    expect(error.name).toBe("NewsNotConfiguredError");
    expect(error.message.length).toBeGreaterThan(0);
  });

  it("ordena las filas por % de cumplimiento descendente (nulos al final, desempate alfabético)", async () => {
    const result = await buildHoursReport(
      {
        scopes: [makeScope()],
        period: { kind: "range", fromIso: "2026-06-01", toIso: "2026-06-30" },
      },
      {
        auth: fakeAuth,
        // El roster del reporte se arma desde las excepciones en BD.
        // Ana: 100%, Beto: 100%, Cami: 100%. Las horas esperadas serán iguales,
        // así que el orden lo define el cumplimiento calculado a partir de
        // las horas reportadas en `listTasks`.
        assignmentRepo: makeFakeAssignmentRepo([
          makeAssignment({ personAdoId: "a", personDisplayName: "Ana", assignmentPct: 100 }),
          makeAssignment({ personAdoId: "b", personDisplayName: "Beto", assignmentPct: 100 }),
          makeAssignment({ personAdoId: "c", personDisplayName: "Cami", assignmentPct: 100 }),
        ]),
        newsStoriesRepo: makeFakeNewsStoriesRepo([
          { workItemId: 500, projectId: "Proyecto A", teamId: "Backend" },
        ]),
        listTasks: async () => [
          makeTask({ id: 1, loggedHours: 80, assignedTo: "Ana", parentId: 500 }),
          makeTask({ id: 2, loggedHours: 40, assignedTo: "Beto", parentId: 500 }),
          makeTask({ id: 3, loggedHours: 0, assignedTo: "Cami", parentId: 500 }),
        ],
        listBugs: async () => [],
        listReportedNews: async () => [],
        listWorkingDays: async () => fixedWorkingDays("2026-06-01", "2026-06-30"),
        now: fixedNow,
      },
    );

    const order = result.rows.map((row) => row.personDisplayName);
    // Ana (mayor cumplimiento) primero, Beto en medio, Cami (sin horas, null) al final.
    expect(order).toEqual(["Ana", "Beto", "Cami"]);
  });
});
