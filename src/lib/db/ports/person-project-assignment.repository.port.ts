import type { PersonProjectAssignment } from "@/lib/db/schema";

export type PersonProjectAssignmentRow = PersonProjectAssignment;

export type PersonProjectAssignmentWithRole = PersonProjectAssignmentRow & {
  roleName: string | null;
  roleDisplayName: string | null;
  createdByDisplayName: string | null;
};

export type CreateAssignmentInput = {
  personAdoId: string;
  personDisplayName: string;
  projectId: string;
  projectName: string;
  teamId: string | null;
  teamName: string | null;
  roleId: string | null;
  assignmentPct: number;
  assignedMonth: string | null;
  validFrom: Date;
  validTo: Date | null;
  createdByUserId: string;
};

export type UpdateAssignmentEndInput = {
  id: string;
  validTo: Date;
};

export type UpdateAssignmentPctInput = {
  id: string;
  assignmentPct: number;
};

export type AssignmentFilter = {
  personAdoId?: string;
  projectId?: string;
  status?: "vigente" | "historica" | "todas";
};

export interface PersonProjectAssignmentRepository {
  listWithRoles(
    filter: AssignmentFilter,
  ): Promise<PersonProjectAssignmentWithRole[]>;

  findById(id: string): Promise<PersonProjectAssignmentRow | null>;

  findByIdWithRole(
    id: string,
  ): Promise<PersonProjectAssignmentWithRole | null>;

  listByPerson(
    personAdoId: string,
  ): Promise<PersonProjectAssignmentRow[]>;

  listOverlappingForPerson(input: {
    personAdoId: string;
    projectId?: string;
    teamId?: string | null;
    from: Date;
    to: Date | null;
    excludeAssignmentId?: string;
  }): Promise<PersonProjectAssignmentRow[]>;

  create(input: CreateAssignmentInput): Promise<PersonProjectAssignmentRow>;

  updateEnd(
    input: UpdateAssignmentEndInput,
  ): Promise<PersonProjectAssignmentRow>;

  updatePct(
    input: UpdateAssignmentPctInput,
  ): Promise<PersonProjectAssignmentRow>;

  deleteById(id: string): Promise<void>;

  listOpenByPersonAndProject(input: {
    personAdoId: string;
    projectId: string;
  }): Promise<PersonProjectAssignmentRow[]>;
}

export class PersonProjectAssignmentNotFoundError extends Error {
  constructor() {
    super("Asignación no encontrada.");
    this.name = "PersonProjectAssignmentNotFoundError";
  }
}
