import "server-only";

import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import {
  listBugsInWorkingDateRange,
  listTasksInWorkingDateRange,
} from "@/lib/azure-devops/work-items-by-date";
import {
  listReportedNews,
  type ReportedNewsDateFilter,
  type ReportedNewsDetail,
  type ReportedNewsScope,
} from "@/lib/azure-devops/list-reported-news";
import { classifyReportedHours, type ReportedTask } from "@/lib/reports/hours/classify-reported-hours";
import { computeCompliance } from "@/lib/reports/hours/compliance";
import { computeExpectedHours } from "@/lib/reports/hours/compute-expected-hours";
import { NEWS_DETAIL_DELIMITER } from "@/lib/reports/hours/format-news-detail";
import type {
  AssignmentPctLabel,
  HoursReportAlert,
  HoursReportResult,
  HoursReportRow,
} from "@/lib/reports/hours/hours-report-types";
import { resolveAssignmentSegments } from "@/lib/reports/hours/resolve-assignment-segments";
import { listWorkingDaysInPeriod } from "@/lib/reports/hours/working-days-in-period";
import type { NewsStoriesRepository } from "@/lib/db/ports/news-stories.repository.port";
import type {
  PersonProjectAssignmentRow,
  PersonProjectAssignmentRepository,
} from "@/lib/db/ports/person-project-assignment.repository.port";

export type BuildHoursReportPeriod =
  | { kind: "month"; monthKey: string }
  | { kind: "range"; fromIso: string; toIso: string };

export type BuildHoursReportFilters = {
  personAdoId?: string;
  roleId?: string;
};

export type BuildHoursReportArgs = {
  scopes: ReadonlyArray<ReportedNewsScope>;
  period: BuildHoursReportPeriod;
  filters?: BuildHoursReportFilters;
};

export type BuildHoursReportDeps = {
  auth: AdoCallerAuth;
  assignmentRepo: PersonProjectAssignmentRepository;
  newsStoriesRepo: NewsStoriesRepository;
  listTasks?: typeof listTasksInWorkingDateRange;
  listBugs?: typeof listBugsInWorkingDateRange;
  /**
   * Novedades reportadas del scope (mismo helper que el módulo de Novedades).
   * Cada novedad tiene `assignedTo` + rango `fechaInicio/fechaFin`; sus horas se
   * calculan como días hábiles del rango (∩ periodo) × 8 × % asignación.
   */
  listReportedNews?: typeof listReportedNews;
  listWorkingDays?: typeof listWorkingDaysInPeriod;
  /**
   * Roster oficial del (proyecto, equipo) del scope. Sus miembros sin
   * excepción en BD se tratan como 100% por defecto (D17/D18, CA-18). Si no
   * se provee, no se infiere ningún default y las personas sin excepción
   * quedan "Sin configurar" (CA-29).
   */
  loadTeamMembers?: (
    scope: ReportedNewsScope,
  ) => Promise<ReadonlyArray<{ personAdoId: string; personDisplayName: string }>>;
  now?: () => Date;
};

export async function buildHoursReport(
  args: BuildHoursReportArgs,
  deps: BuildHoursReportDeps,
): Promise<HoursReportResult> {
  const { scopes, period, filters } = args;
  const fromIso = resolveFromIso(period);
  const toIso = resolveToIso(period);
  if (!fromIso || !toIso) {
    throw new Error("Periodo inválido.");
  }

  const listTasks = deps.listTasks ?? listTasksInWorkingDateRange;
  const listBugs = deps.listBugs ?? listBugsInWorkingDateRange;
  const listNews = deps.listReportedNews ?? listReportedNews;
  const listWorkingDays = deps.listWorkingDays ?? listWorkingDaysInPeriod;
  const now = deps.now ?? (() => new Date());

  const newsDateFilter = toNewsDateFilter(period);
  const workingDays = await listWorkingDays(fromIso, toIso);
  const rows: HoursReportRow[] = [];
  const alerts: HoursReportAlert[] = [];

  for (const scope of scopes) {
    const linkedHUs = await deps.newsStoriesRepo.list({
      projectIds: [scope.projectId],
      teamIds: scope.teamId !== null ? [scope.teamId] : undefined,
    });

    if (linkedHUs.length === 0) {
      alerts.push({
        kind: "news_not_configured",
        message: `Novedades sin configurar: ${scopeLabel(scope)}`,
      });
    }

    const [tasks, bugs, novedades] = await Promise.all([
      listTasks(deps.auth, { startDate: fromIso, finishDate: toIso }, { team: scope.teamId ?? undefined }),
      listBugs(deps.auth, { startDate: fromIso, finishDate: toIso }, { team: scope.teamId ?? undefined }),
      linkedHUs.length > 0
        ? listNews(
            { auth: deps.auth, scopes: [scope], dateFilter: newsDateFilter },
            { repo: deps.newsStoriesRepo },
          )
        : Promise.resolve<ReportedNewsDetail[]>([]),
    ]);

    // Novedades agrupadas por persona (assignedTo, mismo displayName de ADO).
    const novedadesByPerson = new Map<string, ReportedNewsDetail[]>();
    for (const n of novedades) {
      const name = n.assignedTo?.trim();
      if (!name) continue;
      const list = novedadesByPerson.get(name) ?? [];
      list.push(n);
      novedadesByPerson.set(name, list);
    }

    const assignments = await deps.assignmentRepo.listWithRoles({ projectId: scope.projectId });

    const scopeAssignments = assignments.filter(
      (a) =>
        (scope.teamId === null || a.teamId === scope.teamId) &&
        (filters?.personAdoId === undefined || a.personAdoId === filters.personAdoId),
    );

    // Las personas del reporte son EXACTAMENTE las mismas que la pantalla de
    // Asignaciones: el roster oficial del (proyecto, equipo) más quien tenga
    // excepción en BD. Se indexan por `personAdoId` (id estable de ADO, la MISMA
    // clave que usa Asignaciones), no por displayName, para que el conjunto
    // coincida y no haya duplicados por diferencias de nombre. NO se toman los
    // asignados de tasks/bugs (quien reportó trabajo pero ya no está en el equipo
    // no debe aparecer). Toda persona parte de 100% por defecto (D17/D18); si
    // tiene excepción, esa rige.
    const scopeMembers = deps.loadTeamMembers ? await deps.loadTeamMembers(scope) : [];

    const peopleById = new Map<string, { personAdoId: string; displayName: string }>();
    for (const m of scopeMembers) {
      peopleById.set(m.personAdoId, {
        personAdoId: m.personAdoId,
        displayName: m.personDisplayName,
      });
    }
    for (const a of scopeAssignments) {
      if (!peopleById.has(a.personAdoId)) {
        peopleById.set(a.personAdoId, {
          personAdoId: a.personAdoId,
          displayName: a.personDisplayName,
        });
      }
    }

    for (const person of peopleById.values()) {
      if (filters?.personAdoId && person.personAdoId !== filters.personAdoId) continue;
      const personAssignments = scopeAssignments.filter(
        (a) => a.personAdoId === person.personAdoId,
      );
      const hasException = personAssignments.length > 0;
      const segments = resolveAssignmentSegments({
        assignments: toSegmentInputs(personAssignments),
        periodStart: fromIso,
        periodEnd: toIso,
        // Sin excepción ⇒ 100% por defecto para toda persona (D17/D18, CA-18).
        hasInferredDefault: !hasException,
      });
      const expected = computeExpectedHours(workingDays, segments);

      // Todas las tasks (con Completed Work) de la persona son desarrollo; los
      // bugs van aparte. Las novedades ya NO salen de tasks: son items propios.
      const personTasks: ReportedTask[] = tasks
        .filter((t) => t.assignedTo === person.displayName)
        .map((t) => ({ hours: t.loggedHours ?? 0, parentId: t.parentId ?? null }));
      const personBugs = bugs
        .filter((b) => b.assignedTo === person.displayName)
        .map((b) => ({ hours: b.loggedHours ?? 0 }));

      const classified = classifyReportedHours(personTasks, personBugs, EMPTY_NEWS_IDS);

      // Horas novedades = días hábiles del rango de cada novedad (∩ periodo) × 8
      // × % asignación vigente por día (mismo prorrateo que las horas esperadas).
      const personNovedades = novedadesByPerson.get(person.displayName) ?? [];
      const newsDays = collectNewsWorkingDays(personNovedades, workingDays, fromIso, toIso);
      const newsHours = computeExpectedHours(newsDays, segments).expectedHours;
      const newsEntries = novedadesDetailEntries(personNovedades);

      const total = classified.developmentHours + classified.bugHours + newsHours;
      const compliance = computeCompliance(total, expected.expectedHours);

      rows.push({
        projectId: scope.projectId,
        projectName: scope.projectId,
        teamId: scope.teamId,
        teamName: scope.teamId,
        personDisplayName: person.displayName,
        assignmentPct: buildAssignmentLabel(hasException, personAssignments),
        workingDays: expected.workingDays,
        expectedHours: expected.expectedHours,
        developmentHours: classified.developmentHours,
        bugHours: classified.bugHours,
        newsHours,
        totalHours: total,
        newsCount: personNovedades.length,
        newsDays: newsDays.length,
        newsDetail: newsEntries.join(NEWS_DETAIL_DELIMITER),
        newsDetails: newsEntries,
        compliancePct: compliance.pct,
        semaforo: compliance.level,
      });
    }
  }

  return {
    rows,
    generatedAt: now().toISOString(),
    alerts,
  };
}

function resolveFromIso(period: BuildHoursReportPeriod): string | null {
  if (period.kind === "range") return period.fromIso;
  return `${period.monthKey}-01`;
}

function resolveToIso(period: BuildHoursReportPeriod): string | null {
  if (period.kind === "range") return period.toIso;
  const match = /^(\d{4})-(\d{2})$/.exec(period.monthKey.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}

function toSegmentInputs(rows: readonly PersonProjectAssignmentRow[]) {
  return rows.map((r) => ({
    assignmentPct: r.assignmentPct,
    validFrom: toIsoKey(r.validFrom),
    validTo: r.validTo ? toIsoKey(r.validTo) : null,
  }));
}

function toIsoKey(date: Date | string): string {
  if (typeof date === "string") return date.slice(0, 10);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function buildAssignmentLabel(
  hasException: boolean,
  rows: readonly PersonProjectAssignmentRow[],
): AssignmentPctLabel {
  if (hasException) {
    const last = rows.at(-1);
    return { kind: "exception", weightedPct: last?.assignmentPct ?? 100 };
  }
  // Sin excepción en BD ⇒ 100% por defecto (nunca "sin configurar").
  return { kind: "default" };
}

/** Ninguna task se clasifica como novedad: las novedades son items propios. */
const EMPTY_NEWS_IDS: ReadonlySet<number> = new Set<number>();

function toNewsDateFilter(period: BuildHoursReportPeriod): ReportedNewsDateFilter {
  if (period.kind === "month") return { kind: "month", monthKey: period.monthKey };
  return { kind: "range", fromKey: period.fromIso, toKey: period.toIso };
}

/**
 * Días hábiles del periodo cubiertos por al menos una de las novedades de la
 * persona (unión, sin doble conteo). Cada novedad aporta [fechaInicio, fechaFin]
 * recortado al periodo; una novedad sin fecha se toma como abierta a ese lado.
 */
function collectNewsWorkingDays(
  novedades: readonly ReportedNewsDetail[],
  workingDays: readonly string[],
  periodStart: string,
  periodEnd: string,
): string[] {
  const days = new Set<string>();
  for (const n of novedades) {
    const start = (n.fechaInicio ?? periodStart).slice(0, 10);
    const end = (n.fechaFin ?? periodEnd).slice(0, 10);
    const from = start > periodStart ? start : periodStart;
    const to = end < periodEnd ? end : periodEnd;
    for (const day of workingDays) {
      if (day >= from && day <= to) days.add(day);
    }
  }
  return [...days];
}

/** Una entrada `<tipo> - <título>` por novedad (CA-24), para detalle y tooltip. */
function novedadesDetailEntries(novedades: readonly ReportedNewsDetail[]): string[] {
  const entries: string[] = [];
  for (const n of novedades) {
    const title = n.title?.trim();
    if (!title) continue;
    const tipo = n.tipoNovedad?.trim();
    entries.push(tipo ? `${tipo} - ${title}` : title);
  }
  return entries;
}

function scopeLabel(scope: ReportedNewsScope): string {
  return scope.teamId ? `${scope.projectId} / ${scope.teamId}` : `${scope.projectId} (proyecto)`;
}