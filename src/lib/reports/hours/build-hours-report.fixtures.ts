import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import type { AdoWorkItemOption } from "@/lib/azure-devops/work-items";
import type { ReportedNewsScope } from "@/lib/azure-devops/list-reported-news";
import type {
  PersonProjectAssignmentRow,
  PersonProjectAssignmentRepository,
} from "@/lib/db/ports/person-project-assignment.repository.port";
import type { NewsStoriesRepository } from "@/lib/db/ports/news-stories.repository.port";

export const fakeAuth: AdoCallerAuth = {
  mode: "pat",
  organization: "fake-org",
  project: "fake-project",
  pat: "fake-pat",
};

export function makeAssignment(
  overrides: Partial<PersonProjectAssignmentRow> = {},
): PersonProjectAssignmentRow {
  return {
    id: overrides.id ?? "a1",
    personAdoId: overrides.personAdoId ?? "user-1",
    personDisplayName: overrides.personDisplayName ?? "Juan Pérez",
    projectId: overrides.projectId ?? "Proyecto A",
    projectName: overrides.projectName ?? "Proyecto A",
    teamId: overrides.teamId ?? "Backend",
    teamName: overrides.teamName ?? "Backend",
    roleId: overrides.roleId ?? null,
    assignmentPct: overrides.assignmentPct ?? 100,
    validFrom: overrides.validFrom ?? new Date("2026-01-01"),
    validTo: overrides.validTo ?? null,
    createdByUserId: overrides.createdByUserId ?? "u1",
    createdAt: overrides.createdAt ?? new Date("2026-01-01"),
  };
}

export function makeScope(
  overrides: Partial<ReportedNewsScope> = {},
): ReportedNewsScope {
  return {
    projectId: overrides.projectId ?? "Proyecto A",
    teamId: overrides.teamId ?? "Backend",
  };
}

export function makeTask(
  overrides: Partial<AdoWorkItemOption> = {},
): AdoWorkItemOption {
  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? "Task",
    type: overrides.type ?? "Task",
    state: overrides.state ?? "Done",
    assignedTo: overrides.assignedTo ?? "Juan Pérez",
    parentId: overrides.parentId,
    loggedHours: overrides.loggedHours ?? 8,
    workingDate: overrides.workingDate ?? "2026-06-15",
    description: overrides.description ?? "",
    ...overrides,
  };
}

export function makeBug(
  overrides: Partial<AdoWorkItemOption> = {},
): AdoWorkItemOption {
  return {
    id: overrides.id ?? 100,
    title: overrides.title ?? "Bug",
    type: overrides.type ?? "Bug",
    state: overrides.state ?? "Done",
    assignedTo: overrides.assignedTo ?? "Juan Pérez",
    loggedHours: overrides.loggedHours ?? 4,
    workingDate: overrides.workingDate ?? "2026-06-15",
    description: overrides.description ?? "",
    ...overrides,
  };
}

export function makeFakeAssignmentRepo(
  rows: readonly PersonProjectAssignmentRow[],
): PersonProjectAssignmentRepository {
  return {
    async listWithRoles() {
      return rows.map((r) => ({ ...r, roleName: null, roleDisplayName: null, createdByDisplayName: null }));
    },
    async listByPerson() {
      return [...rows];
    },
    async findById(id) {
      return rows.find((r) => r.id === id) ?? null;
    },
    async findByIdWithRole(id) {
      const r = rows.find((row) => row.id === id);
      return r ? { ...r, roleName: null, roleDisplayName: null, createdByDisplayName: null } : null;
    },
    async listInferredDefaults(input) {
      const configured = new Set(
        rows.map((r) => `${r.personAdoId}::${r.projectId}`),
      );
      return input.members
        .filter((m) => !configured.has(`${m.personAdoId}::${m.projectId}`))
        .map((m) => ({
          personAdoId: m.personAdoId,
          personDisplayName: m.personDisplayName,
          projectId: m.projectId,
          projectName: m.projectName,
          teamId: m.teamId,
          teamName: m.teamName,
        }));
    },
    async listOverlappingForPerson() {
      return [];
    },
    async listOpenByPersonAndProject() {
      return [];
    },
    async create(input) {
      return { ...input, id: "new" } as PersonProjectAssignmentRow;
    },
    async updateEnd(input) {
      const r = rows.find((row) => row.id === input.id);
      return r ? { ...r, validTo: input.validTo } : ({} as PersonProjectAssignmentRow);
    },
    async update(input) {
      const r = rows.find((row) => row.id === input.id);
      if (!r) return {} as PersonProjectAssignmentRow;
      const { id: _id, ...fields } = input;
      void _id;
      const patch = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined),
      );
      return { ...r, ...patch } as PersonProjectAssignmentRow;
    },
    async updatePct(input) {
      const r = rows.find((row) => row.id === input.id);
      return r ? { ...r, assignmentPct: input.assignmentPct } : ({} as PersonProjectAssignmentRow);
    },
    async deleteById() {
      return;
    },
  };
}

export function makeFakeNewsStoriesRepo(
  linked: ReadonlyArray<{ projectId: string; teamId: string | null; workItemId: number; workItemTitleSnapshot?: string | null }>,
): NewsStoriesRepository {
  return {
    async list(filter) {
      return linked
        .filter((row) =>
          (!filter.projectIds || filter.projectIds.length === 0 || filter.projectIds.includes(row.projectId)) &&
          (!filter.teamIds || filter.teamIds.length === 0 || (row.teamId !== null && filter.teamIds.includes(row.teamId))),
        )
        .map((row, index) => ({
          id: `link-${index}`,
          projectId: row.projectId,
          teamId: row.teamId,
          workItemId: row.workItemId,
          workItemTitleSnapshot: row.workItemTitleSnapshot ?? null,
          linkedByUserId: "u1",
          linkedAt: new Date(),
        }));
    },
    async findByKey(key) {
      const row = linked.find(
        (r) => r.projectId === key.projectId && r.teamId === key.teamId && r.workItemId === key.workItemId,
      );
      return row
        ? {
            id: "link-1",
            projectId: row.projectId,
            teamId: row.teamId,
            workItemId: row.workItemId,
            workItemTitleSnapshot: row.workItemTitleSnapshot ?? null,
            linkedByUserId: "u1",
            linkedAt: new Date(),
          }
        : null;
    },
    async create(input) {
      return { ...input, id: "new", linkedAt: new Date() };
    },
    async deleteById() {
      return;
    },
  };
}