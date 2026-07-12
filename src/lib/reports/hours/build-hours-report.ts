import "server-only";

import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import {
  listBugsInWorkingDateRange,
  listTasksInWorkingDateRange,
} from "@/lib/azure-devops/work-items-by-date";
import type { ReportedNewsScope } from "@/lib/azure-devops/list-reported-news";
import { fetchUserStoriesByIds } from "@/lib/azure-devops/fetch-user-stories-by-ids";
import { classifyReportedHours, type ReportedTask } from "@/lib/reports/hours/classify-reported-hours";
import { computeCompliance } from "@/lib/reports/hours/compliance";
import { computeExpectedHours } from "@/lib/reports/hours/compute-expected-hours";
import { formatNewsDetail, type NewsStoryInfo } from "@/lib/reports/hours/format-news-detail";
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
  fetchUserStories?: typeof fetchUserStoriesByIds;
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
  const fetchUserStories = deps.fetchUserStories ?? fetchUserStoriesByIds;
  const listWorkingDays = deps.listWorkingDays ?? listWorkingDaysInPeriod;
  const now = deps.now ?? (() => new Date());

  const workingDays = await listWorkingDays(fromIso, toIso);
  const rows: HoursReportRow[] = [];
  const alerts: HoursReportAlert[] = [];

  for (const scope of scopes) {
    const linkedHUs = await deps.newsStoriesRepo.list({
      projectIds: [scope.projectId],
      teamIds: scope.teamId !== null ? [scope.teamId] : undefined,
    });
    const newsStoryIds = new Set<number>(
      linkedHUs.map((row) => row.workItemId).filter((id) => Number.isInteger(id) && id > 0),
    );

    if (linkedHUs.length === 0) {
      alerts.push({
        kind: "news_not_configured",
        message: `Novedades sin configurar: ${scopeLabel(scope)}`,
      });
    }

    const [tasks, bugs] = await Promise.all([
      listTasks(deps.auth, { startDate: fromIso, finishDate: toIso }, { team: scope.teamId ?? undefined }),
      listBugs(deps.auth, { startDate: fromIso, finishDate: toIso }, { team: scope.teamId ?? undefined }),
    ]);

    const storyInfos = await resolveStoryInfos(fetchUserStories, deps.auth, newsStoryIds, linkedHUs, alerts);

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

      const personTasks: ReportedTask[] = tasks
        .filter((t) => t.assignedTo === person.displayName && t.parentId !== undefined)
        .map((t) => ({ hours: t.loggedHours ?? 0, parentId: t.parentId ?? null }));
      const personBugs = bugs
        .filter((b) => b.assignedTo === person.displayName)
        .map((b) => ({ hours: b.loggedHours ?? 0 }));

      const classified = classifyReportedHours(personTasks, personBugs, newsStoryIds);
      const total = classified.developmentHours + classified.bugHours + classified.newsHours;
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
        newsHours: classified.newsHours,
        totalHours: total,
        newsCount: classified.newsStoryIds.length,
        newsDetail: formatNewsDetail(classified.newsStoryIds, storyInfos),
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

async function resolveStoryInfos(
  fetchUserStories: typeof fetchUserStoriesByIds,
  auth: AdoCallerAuth,
  newsStoryIds: ReadonlySet<number>,
  linkedHUs: ReadonlyArray<{ workItemId: number; workItemTitleSnapshot?: string | null }>,
  alerts: HoursReportAlert[],
): Promise<ReadonlyMap<number, NewsStoryInfo>> {
  if (newsStoryIds.size === 0) return new Map();
  const snapshots = await fetchUserStories(auth, Array.from(newsStoryIds));
  const foundIds = new Set(snapshots.map((s) => s.id));
  for (const id of newsStoryIds) {
    if (!foundIds.has(id)) {
      alerts.push({
        kind: "news_story_deleted",
        message: `HU de novedad eliminada en Azure: ${id}`,
      });
    }
  }
  const byId = new Map<number, NewsStoryInfo>();
  for (const s of snapshots) {
    byId.set(s.id, { type: s.type, title: s.title });
  }
  for (const row of linkedHUs) {
    if (!byId.has(row.workItemId) && row.workItemTitleSnapshot) {
      byId.set(row.workItemId, { type: null, title: row.workItemTitleSnapshot });
    }
  }
  return byId;
}

function scopeLabel(scope: ReportedNewsScope): string {
  return scope.teamId ? `${scope.projectId} / ${scope.teamId}` : `${scope.projectId} (proyecto)`;
}