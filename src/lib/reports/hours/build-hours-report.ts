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
import {
  computeHoursByPerson,
} from "@/lib/hours/aggregate-hours";
import { EMPTY_HOURS_BREAKDOWN, type HoursBreakdown } from "@/lib/hours/hours-breakdown";
import { computeCompliance } from "@/lib/reports/hours/compliance";
import { computeDeviation } from "@/lib/reports/hours/deviation";
import { computeExpectedHours } from "@/lib/expected-hours";
import { NEWS_DETAIL_DELIMITER } from "@/lib/reports/hours/format-news-detail";
import { roundHours, roundToDecimals } from "@/lib/number/rounding";
import { HOURS_PER_WORKING_DAY } from "@/lib/working-days";
import type {
  AssignmentPctLabel,
  HoursReportAlert,
  HoursReportResult,
  HoursReportRow,
} from "@/lib/reports/hours/hours-report-types";
import {
  resolveAssignmentSegments,
  toAssignmentsForSegments,
} from "@/lib/reports/hours/resolve-assignment-segments";
import { loadWorkingDayKeysInRange } from "@/lib/hours/load-working-day-keys";
import type { NewsStoriesRepository } from "@/lib/db/ports/news-stories.repository.port";
import { NewsNotConfiguredError } from "@/lib/reports/hours/errors";
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
  listWorkingDays?: typeof loadWorkingDayKeysInRange;
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

  const listWorkingDays = deps.listWorkingDays ?? loadWorkingDayKeysInRange;
  const now = deps.now ?? (() => new Date());

  const newsDateFilter = toNewsDateFilter(period);
  const workingDays = await listWorkingDays(fromIso, toIso);
  const workingDayKeys = new Set(workingDays);
  const rows: HoursReportRow[] = [];
  const alerts: HoursReportAlert[] = [];

  let anyScopeHasNews = false;

  for (const scope of scopes) {
    const scopeReport = await loadScopeReport({
      scope,
      period,
      fromIso,
      toIso,
      deps,
      newsDateFilter,
      filters,
      workingDays,
      workingDayKeys,
    });
    if (scopeReport.hasNews) anyScopeHasNews = true;
    alerts.push(...scopeReport.alerts);
    rows.push(...scopeReport.rows);
  }

  if (!anyScopeHasNews) {
    throw new NewsNotConfiguredError();
  }

  return {
    rows: sortHoursReportRowsByComplianceDesc(rows),
    generatedAt: now().toISOString(),
    alerts,
  };
}

async function loadScopeReport(input: {
  scope: ReportedNewsScope;
  period: BuildHoursReportPeriod;
  fromIso: string;
  toIso: string;
  deps: BuildHoursReportDeps;
  newsDateFilter: ReportedNewsDateFilter;
  filters?: BuildHoursReportFilters;
  workingDays: readonly string[];
  workingDayKeys: Set<string>;
}): Promise<{ rows: HoursReportRow[]; alerts: HoursReportAlert[]; hasNews: boolean }> {
  const {
    scope,
    fromIso,
    toIso,
    deps,
    newsDateFilter,
    filters,
    workingDays,
    workingDayKeys,
  } = input;

  const listTasks = deps.listTasks ?? listTasksInWorkingDateRange;
  const listBugs = deps.listBugs ?? listBugsInWorkingDateRange;
  const listNews = deps.listReportedNews ?? listReportedNews;

  const linkedHUs = await deps.newsStoriesRepo.list({
    projectIds: [scope.projectId],
    teamIds: scope.teamId !== null ? [scope.teamId] : undefined,
  });

  const alerts: HoursReportAlert[] = [];
  if (linkedHUs.length === 0) {
    alerts.push({
      kind: "news_not_configured",
      message: `Novedades sin configurar: ${scopeLabel(scope)}`,
    });
  }

  const [tasks, bugs, novedades] = await Promise.all([
    listTasks(
      deps.auth,
      { startDate: fromIso, finishDate: toIso },
      { team: scope.teamId ?? undefined },
    ),
    listBugs(
      deps.auth,
      { startDate: fromIso, finishDate: toIso },
      { team: scope.teamId ?? undefined },
    ),
    loadScopeNovedades({
      hasNews: linkedHUs.length > 0,
      scope,
      newsDateFilter,
      deps,
      listNews,
    }),
  ]);

  const hoursByPerson = computeHoursByPerson(
    { tasks, bugs, workingDayKeys },
    (assignedTo) => assignedTo?.trim() || null,
  );
  const novedadesByPerson = groupNovedadesByPerson(novedades);

  const assignments = await deps.assignmentRepo.listWithRoles({
    projectId: scope.projectId,
  });
  const scopeAssignments = filterAssignmentsByScope(assignments, scope, filters?.personAdoId);

  const scopeMembers = deps.loadTeamMembers ? await deps.loadTeamMembers(scope) : [];
  const peopleById = buildPeopleIndex(scopeMembers, scopeAssignments);

  const rows = buildScopeRows({
    scope,
    people: [...peopleById.values()],
    scopeAssignments,
    hoursByPerson,
    novedadesByPerson,
    workingDays,
    fromIso,
    toIso,
    personAdoId: filters?.personAdoId,
  });

  return { rows, alerts, hasNews: linkedHUs.length > 0 };
}

async function loadScopeNovedades(input: {
  hasNews: boolean;
  scope: ReportedNewsScope;
  newsDateFilter: ReportedNewsDateFilter;
  deps: BuildHoursReportDeps;
  listNews: typeof listReportedNews;
}): Promise<ReportedNewsDetail[]> {
  if (!input.hasNews) return [];
  return input.listNews(
    { auth: input.deps.auth, scopes: [input.scope], dateFilter: input.newsDateFilter },
    { repo: input.deps.newsStoriesRepo },
  );
}

function groupNovedadesByPerson(
  novedades: readonly ReportedNewsDetail[],
): Map<string, ReportedNewsDetail[]> {
  const grouped = new Map<string, ReportedNewsDetail[]>();
  for (const n of novedades) {
    const name = n.assignedTo?.trim();
    if (!name) continue;
    const list = grouped.get(name) ?? [];
    list.push(n);
    grouped.set(name, list);
  }
  return grouped;
}

function filterAssignmentsByScope(
  assignments: readonly PersonProjectAssignmentRow[],
  scope: ReportedNewsScope,
  personAdoId: string | undefined,
): PersonProjectAssignmentRow[] {
  return assignments.filter(
    (a) =>
      (scope.teamId === null || a.teamId === scope.teamId) &&
      (personAdoId === undefined || a.personAdoId === personAdoId),
  );
}

function buildPeopleIndex(
  scopeMembers: ReadonlyArray<{ personAdoId: string; personDisplayName: string }>,
  scopeAssignments: readonly PersonProjectAssignmentRow[],
): Map<string, { personAdoId: string; displayName: string }> {
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
  return peopleById;
}

function buildScopeRows(input: {
  scope: ReportedNewsScope;
  people: ReadonlyArray<{ personAdoId: string; displayName: string }>;
  scopeAssignments: readonly PersonProjectAssignmentRow[];
  hoursByPerson: ReadonlyMap<string, HoursBreakdown>;
  novedadesByPerson: Map<string, ReportedNewsDetail[]>;
  workingDays: readonly string[];
  fromIso: string;
  toIso: string;
  personAdoId: string | undefined;
}): HoursReportRow[] {
  const rows: HoursReportRow[] = [];
  for (const person of input.people) {
    if (input.personAdoId && person.personAdoId !== input.personAdoId) continue;
    rows.push(
      buildPersonReportRow({
        scope: input.scope,
        person,
        scopeAssignments: input.scopeAssignments,
        hoursByPerson: input.hoursByPerson,
        novedadesByPerson: input.novedadesByPerson,
        workingDays: input.workingDays,
        fromIso: input.fromIso,
        toIso: input.toIso,
      }),
    );
  }
  return rows;
}

function buildPersonReportRow(input: {
  scope: ReportedNewsScope;
  person: { personAdoId: string; displayName: string };
  scopeAssignments: readonly PersonProjectAssignmentRow[];
  hoursByPerson: ReadonlyMap<string, HoursBreakdown>;
  novedadesByPerson: Map<string, ReportedNewsDetail[]>;
  workingDays: readonly string[];
  fromIso: string;
  toIso: string;
}): HoursReportRow {
  const personAssignments = input.scopeAssignments.filter(
    (a) => a.personAdoId === input.person.personAdoId,
  );
  const hasException = personAssignments.length > 0;
  const segments = resolveAssignmentSegments({
    assignments: toAssignmentsForSegments(personAssignments),
    periodStart: input.fromIso,
    periodEnd: input.toIso,
    hasInferredDefault: !hasException,
  });
  const expected = computeExpectedHours(input.workingDays, segments);

  const worked = input.hoursByPerson.get(input.person.displayName) ?? EMPTY_HOURS_BREAKDOWN;
  const personNovedades = input.novedadesByPerson.get(input.person.displayName) ?? [];
  const newsHours = roundHours(
    personNovedades.reduce((sum, n) => sum + (n.completedWork ?? 0), 0),
  );
  const newsDays = roundToDecimals(newsHours / HOURS_PER_WORKING_DAY, 2);
  const newsEntries = novedadesDetailEntries(personNovedades);
  const workedHours = worked.taskHours + worked.bugHours;
  const total = workedHours + newsHours;
  const compliance = computeCompliance(total, expected.expectedHours);
  const assignmentPct = buildAssignmentLabel(hasException, personAssignments);
  const deviation = computeDeviation(compliance.pct);

  return {
    projectId: input.scope.projectId,
    projectName: input.scope.projectId,
    teamId: input.scope.teamId,
    teamName: input.scope.teamId,
    personDisplayName: input.person.displayName,
    assignmentPct,
    workingDays: expected.workingDays,
    expectedHours: expected.expectedHours,
    developmentHours: worked.taskHours,
    bugHours: worked.bugHours,
    workedHours,
    newsHours,
    totalHours: total,
    newsCount: personNovedades.length,
    newsDays,
    newsDetail: newsEntries.join(NEWS_DETAIL_DELIMITER),
    newsDetails: newsEntries,
    compliancePct: compliance.pct,
    semaforo: compliance.level,
    deviationPct: deviation.pct,
    deviationLevel: deviation.level,
  };
}

function resolveFromIso(period: BuildHoursReportPeriod): string | null {
  if (period.kind === "range") return period.fromIso;
  const parsed = parseMonthKey(period.monthKey);
  if (!parsed) return null;
  return formatIsoDate(parsed.year, parsed.month, 1);
}

function resolveToIso(period: BuildHoursReportPeriod): string | null {
  if (period.kind === "range") return period.toIso;
  const parsed = parseMonthKey(period.monthKey);
  if (!parsed) return null;
  return lastDayOfMonthIso(parsed.year, parsed.month);
}

function parseMonthKey(monthKey: string): { year: number; month: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function lastDayOfMonthIso(year: number, month: number): string {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return formatIsoDate(year, month, lastDay);
}

function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${padTwo(month)}-${padTwo(day)}`;
}

function padTwo(value: number): string {
  return String(value).padStart(2, "0");
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

function toNewsDateFilter(period: BuildHoursReportPeriod): ReportedNewsDateFilter {
  if (period.kind === "month") return { kind: "month", monthKey: period.monthKey };
  return { kind: "range", fromKey: period.fromIso, toKey: period.toIso };
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

/**
 * Orden final del reporte: % de cumplimiento descendente, nulos al final,
 * desempate alfabético por nombre de persona para que el orden sea estable
 * entre generaciones con el mismo set de datos.
 */
function sortHoursReportRowsByComplianceDesc(
  rows: readonly HoursReportRow[],
): HoursReportRow[] {
  return [...rows].sort((left, right) => {
    if (left.compliancePct === null && right.compliancePct === null) return 0;
    if (left.compliancePct === null) return 1;
    if (right.compliancePct === null) return -1;
    const diff = right.compliancePct - left.compliancePct;
    if (diff !== 0) return diff;
    return left.personDisplayName.localeCompare(right.personDisplayName, "es");
  });
}