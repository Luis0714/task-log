import "server-only";

import { and, asc, desc, eq, isNull, ne, or, sql } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import {
  personProjectAssignments,
  roles,
  users,
  type NewPersonProjectAssignment,
} from "@/lib/db/schema";
import type {
  AssignmentFilter,
  CreateAssignmentInput,
  PersonProjectAssignmentRepository,
  PersonProjectAssignmentRow,
  PersonProjectAssignmentWithRole,
  UpdateAssignmentEndInput,
} from "@/lib/db/ports/person-project-assignment.repository.port";

function statusPredicate(filter: AssignmentFilter) {
  if (filter.status === "vigente") {
    return isNull(personProjectAssignments.validTo);
  }
  if (filter.status === "historica") {
    return sql`${personProjectAssignments.validTo} IS NOT NULL`;
  }
  return undefined;
}

function applyFilter(filter: AssignmentFilter) {
  const parts = [] as ReturnType<typeof eq>[];
  if (filter.personAdoId) parts.push(eq(personProjectAssignments.personAdoId, filter.personAdoId));
  if (filter.projectId) parts.push(eq(personProjectAssignments.projectId, filter.projectId));
  const status = statusPredicate(filter);
  if (status) parts.push(status);
  return parts.length ? and(...parts) : undefined;
}

export const drizzlePersonProjectAssignmentRepository: PersonProjectAssignmentRepository =
  {
    async listWithRoles(filter): Promise<PersonProjectAssignmentWithRole[]> {
      const where = applyFilter(filter);
      const rows = await getDb()
        .select({
          id: personProjectAssignments.id,
          personAdoId: personProjectAssignments.personAdoId,
          personDisplayName: personProjectAssignments.personDisplayName,
          projectId: personProjectAssignments.projectId,
          projectName: personProjectAssignments.projectName,
          teamId: personProjectAssignments.teamId,
          teamName: personProjectAssignments.teamName,
          roleId: personProjectAssignments.roleId,
          assignmentPct: personProjectAssignments.assignmentPct,
          assignedMonth: personProjectAssignments.assignedMonth,
          validFrom: personProjectAssignments.validFrom,
          validTo: personProjectAssignments.validTo,
          createdByUserId: personProjectAssignments.createdByUserId,
          createdAt: personProjectAssignments.createdAt,
          roleName: roles.name,
          roleDisplayName: roles.displayName,
          createdByDisplayName: users.displayName,
        })
        .from(personProjectAssignments)
        .leftJoin(roles, eq(roles.id, personProjectAssignments.roleId))
        .leftJoin(users, eq(users.id, personProjectAssignments.createdByUserId))
        .where(where)
        .orderBy(
          desc(isNull(personProjectAssignments.validTo)),
          asc(personProjectAssignments.personDisplayName),
          asc(personProjectAssignments.teamName),
          desc(personProjectAssignments.validFrom),
        );
      return rows;
    },

    async findById(id): Promise<PersonProjectAssignmentRow | null> {
      const rows = await getDb()
        .select()
        .from(personProjectAssignments)
        .where(eq(personProjectAssignments.id, id))
        .limit(1);
      return rows[0] ?? null;
    },

    async findByIdWithRole(id): Promise<PersonProjectAssignmentWithRole | null> {
      const rows = await getDb()
        .select({
          id: personProjectAssignments.id,
          personAdoId: personProjectAssignments.personAdoId,
          personDisplayName: personProjectAssignments.personDisplayName,
          projectId: personProjectAssignments.projectId,
          projectName: personProjectAssignments.projectName,
          teamId: personProjectAssignments.teamId,
          teamName: personProjectAssignments.teamName,
          roleId: personProjectAssignments.roleId,
          assignmentPct: personProjectAssignments.assignmentPct,
          assignedMonth: personProjectAssignments.assignedMonth,
          validFrom: personProjectAssignments.validFrom,
          validTo: personProjectAssignments.validTo,
          createdByUserId: personProjectAssignments.createdByUserId,
          createdAt: personProjectAssignments.createdAt,
          roleName: roles.name,
          roleDisplayName: roles.displayName,
          createdByDisplayName: users.displayName,
        })
        .from(personProjectAssignments)
        .leftJoin(roles, eq(roles.id, personProjectAssignments.roleId))
        .leftJoin(users, eq(users.id, personProjectAssignments.createdByUserId))
        .where(eq(personProjectAssignments.id, id))
        .limit(1);
      return rows[0] ?? null;
    },

    async listByPerson(personAdoId): Promise<PersonProjectAssignmentRow[]> {
      return getDb()
        .select()
        .from(personProjectAssignments)
        .where(eq(personProjectAssignments.personAdoId, personAdoId))
        .orderBy(desc(personProjectAssignments.validFrom));
    },

    async listOverlappingForPerson(input): Promise<PersonProjectAssignmentRow[]> {
      const parts = [
        eq(personProjectAssignments.personAdoId, input.personAdoId),
      ];
      if (input.projectId) {
        parts.push(eq(personProjectAssignments.projectId, input.projectId));
      }
      if (input.teamId !== undefined) {
        parts.push(
          input.teamId === null
            ? isNull(personProjectAssignments.teamId)
            : eq(personProjectAssignments.teamId, input.teamId),
        );
      }
      if (input.excludeAssignmentId) {
        parts.push(ne(personProjectAssignments.id, input.excludeAssignmentId));
      }
      const inputFrom = input.from;
      const inputTo = input.to;
      const openEnded = or(
        isNull(personProjectAssignments.validTo),
        sql`${personProjectAssignments.validTo} >= ${inputFrom}`,
      );
      const closedEnded = sql`${personProjectAssignments.validFrom} <= COALESCE(${inputTo}::date, ${personProjectAssignments.validFrom})`;
      parts.push(and(openEnded, closedEnded)!);

      return getDb()
        .select()
        .from(personProjectAssignments)
        .where(and(...parts));
    },

    async create(input: CreateAssignmentInput): Promise<PersonProjectAssignmentRow> {
      const values: NewPersonProjectAssignment = {
        personAdoId: input.personAdoId,
        personDisplayName: input.personDisplayName,
        projectId: input.projectId,
        projectName: input.projectName,
        teamId: input.teamId,
        teamName: input.teamName,
        roleId: input.roleId,
        assignmentPct: input.assignmentPct,
        assignedMonth: input.assignedMonth,
        validFrom: input.validFrom,
        validTo: input.validTo,
        createdByUserId: input.createdByUserId,
      };
      const [row] = await getDb()
        .insert(personProjectAssignments)
        .values(values)
        .returning();
      if (!row) {
        throw new Error("No se pudo crear la asignación.");
      }
      return row;
    },

    async updateEnd(input: UpdateAssignmentEndInput): Promise<PersonProjectAssignmentRow> {
      const [row] = await getDb()
        .update(personProjectAssignments)
        .set({ validTo: input.validTo })
        .where(eq(personProjectAssignments.id, input.id))
        .returning();
      if (!row) {
        const err = new Error("Asignación no encontrada.");
        err.name = "PersonProjectAssignmentNotFoundError";
        throw err;
      }
      return row;
    },

    async listOpenByPersonAndProject(input): Promise<PersonProjectAssignmentRow[]> {
      return getDb()
        .select()
        .from(personProjectAssignments)
        .where(
          and(
            eq(personProjectAssignments.personAdoId, input.personAdoId),
            eq(personProjectAssignments.projectId, input.projectId),
            isNull(personProjectAssignments.validTo),
          ),
        )
        .orderBy(desc(personProjectAssignments.validFrom));
    },
  };
