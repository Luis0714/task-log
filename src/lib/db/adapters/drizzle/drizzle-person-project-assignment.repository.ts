import "server-only";

import { and, asc, desc, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";

import { filterInferredDefaultSlots } from "@/lib/assignments/filter-inferred-default-slots";
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
  InferredDefaultAssignmentRow,
  InferredDefaultsInput,
  PersonProjectAssignmentRepository,
  PersonProjectAssignmentRow,
  PersonProjectAssignmentWithRole,
  UpdateAssignmentEndInput,
  UpdateAssignmentInput,
  UpdateAssignmentPctInput,
} from "@/lib/db/ports/person-project-assignment.repository.port";

function applyFilter(filter: AssignmentFilter) {
  const parts = [] as ReturnType<typeof eq>[];
  if (filter.personAdoId) {
    parts.push(eq(personProjectAssignments.personAdoId, filter.personAdoId));
  }
  if (filter.projectId) {
    parts.push(eq(personProjectAssignments.projectId, filter.projectId));
  }
  return parts.length ? and(...parts) : undefined;
}

const ROW_PROJECTION = {
  id: personProjectAssignments.id,
  personAdoId: personProjectAssignments.personAdoId,
  personDisplayName: personProjectAssignments.personDisplayName,
  projectId: personProjectAssignments.projectId,
  projectName: personProjectAssignments.projectName,
  teamId: personProjectAssignments.teamId,
  teamName: personProjectAssignments.teamName,
  roleId: personProjectAssignments.roleId,
  assignmentPct: personProjectAssignments.assignmentPct,
  validFrom: personProjectAssignments.validFrom,
  validTo: personProjectAssignments.validTo,
  createdByUserId: personProjectAssignments.createdByUserId,
  createdAt: personProjectAssignments.createdAt,
  roleName: roles.name,
  roleDisplayName: roles.displayName,
  createdByDisplayName: users.displayName,
} as const;


export const drizzlePersonProjectAssignmentRepository: PersonProjectAssignmentRepository =
  {
    async listWithRoles(filter): Promise<PersonProjectAssignmentWithRole[]> {
      const where = applyFilter(filter);
      return getDb()
        .select(ROW_PROJECTION)
        .from(personProjectAssignments)
        .leftJoin(roles, eq(roles.id, personProjectAssignments.roleId))
        .leftJoin(users, eq(users.id, personProjectAssignments.createdByUserId))
        .where(where)
        .orderBy(
          asc(personProjectAssignments.personDisplayName),
          asc(personProjectAssignments.teamName),
          desc(personProjectAssignments.validFrom),
        );
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
        .select(ROW_PROJECTION)
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

    async listInferredDefaults(
      input: InferredDefaultsInput,
    ): Promise<InferredDefaultAssignmentRow[]> {
      if (input.members.length === 0) return [];

      const personAdoIds = [
        ...new Set(input.members.map((m) => m.personAdoId)),
      ];

      const existingSlots = await getDb()
        .selectDistinct({
          personAdoId: personProjectAssignments.personAdoId,
          projectId: personProjectAssignments.projectId,
          teamId: personProjectAssignments.teamId,
        })
        .from(personProjectAssignments)
        .where(inArray(personProjectAssignments.personAdoId, personAdoIds));

      return filterInferredDefaultSlots(input.members, existingSlots);
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
      const openEnded = or(
        isNull(personProjectAssignments.validTo),
        sql`${personProjectAssignments.validTo} >= ${input.from}`,
      );
      const closedEnded = sql`${personProjectAssignments.validFrom} <= COALESCE(${input.to}::date, ${personProjectAssignments.validFrom})`;
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

    async update(input: UpdateAssignmentInput): Promise<PersonProjectAssignmentRow> {
      const { id, ...fields } = input;
      // Solo aplicamos las claves realmente presentes (undefined = no tocar).
      const set: Partial<NewPersonProjectAssignment> = {};
      if (fields.projectId !== undefined) set.projectId = fields.projectId;
      if (fields.projectName !== undefined) set.projectName = fields.projectName;
      if (fields.teamId !== undefined) set.teamId = fields.teamId;
      if (fields.teamName !== undefined) set.teamName = fields.teamName;
      if (fields.roleId !== undefined) set.roleId = fields.roleId;
      if (fields.assignmentPct !== undefined) set.assignmentPct = fields.assignmentPct;
      if (fields.validFrom !== undefined) set.validFrom = fields.validFrom;
      if (fields.validTo !== undefined) set.validTo = fields.validTo;

      const [row] = await getDb()
        .update(personProjectAssignments)
        .set(set)
        .where(eq(personProjectAssignments.id, id))
        .returning();
      if (!row) {
        const err = new Error("Asignación no encontrada.");
        err.name = "PersonProjectAssignmentNotFoundError";
        throw err;
      }
      return row;
    },

    async updatePct(input: UpdateAssignmentPctInput): Promise<PersonProjectAssignmentRow> {
      const [row] = await getDb()
        .update(personProjectAssignments)
        .set({ assignmentPct: input.assignmentPct })
        .where(eq(personProjectAssignments.id, input.id))
        .returning();
      if (!row) {
        const err = new Error("Asignación no encontrada.");
        err.name = "PersonProjectAssignmentNotFoundError";
        throw err;
      }
      return row;
    },

    async deleteById(id: string): Promise<void> {
      await getDb()
        .delete(personProjectAssignments)
        .where(eq(personProjectAssignments.id, id));
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
