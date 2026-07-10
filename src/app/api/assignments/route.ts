import { NextResponse } from "next/server";

import {
  ASSIGNMENT_ERROR_CODES,
  ASSIGNMENT_HTTP_STATUS,
  ASSIGNMENT_USER_MESSAGES,
  type AssignmentErrorCode,
  type AssignmentErrorKey,
  isAssignmentErrorKey,
} from "@/lib/assignments/error-codes";
import { assignmentRowToDto } from "@/lib/assignments/build-assignment-row";
import { validateNewAssignment } from "@/lib/assignments/validate-new-assignment";
import {
  checkOverAllocation,
  type AllocationItem,
} from "@/lib/assignments/over-allocation";
import { endOfDay, startOfDay } from "@/lib/assignments/is-assignment-open";
import type { PersonProjectAssignmentRow } from "@/lib/db";
import { getRepositories } from "@/lib/db";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import {
  assignmentFilterSchema,
  createAssignmentBodySchema,
} from "@/lib/schemas/assignments";
import { requireManagementUser } from "@/app/api/assignments/helpers";

export const dynamic = "force-dynamic";

const DEFAULT_ERROR_KEY: AssignmentErrorKey = "roleRequired";

function codeToKey(code: AssignmentErrorCode): AssignmentErrorKey {
  for (const [key, value] of Object.entries(ASSIGNMENT_ERROR_CODES)) {
    if (value === code && isAssignmentErrorKey(key)) return key;
  }
  return DEFAULT_ERROR_KEY;
}

function failResponse(key: AssignmentErrorKey, code: AssignmentErrorCode) {
  return NextResponse.json(
    { error: ASSIGNMENT_USER_MESSAGES[key], code },
    { status: ASSIGNMENT_HTTP_STATUS[key] },
  );
}

function failWithContext(
  key: AssignmentErrorKey,
  code: AssignmentErrorCode,
  extras: { currentTotal?: number; conflictingPct?: number },
) {
  return NextResponse.json(
    {
      error: ASSIGNMENT_USER_MESSAGES[key],
      code,
      currentTotal: extras.currentTotal ?? null,
      conflictingPct: extras.conflictingPct ?? null,
    },
    { status: ASSIGNMENT_HTTP_STATUS[key] },
  );
}

export async function GET(req: Request) {
  const auth = await requireManagementUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const url = new URL(req.url);
  const parsedFilter = assignmentFilterSchema.safeParse({
    personAdoId: url.searchParams.get("personAdoId") ?? undefined,
    projectId: url.searchParams.get("projectId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });
  if (!parsedFilter.success) {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidPayload },
      { status: 400 },
    );
  }

  try {
    const rows = await getRepositories().personProjectAssignment.listWithRoles({
      ...parsedFilter.data,
      status: parsedFilter.data.status ?? "todas",
    });
    return NextResponse.json({
      assignments: rows.map(assignmentRowToDto),
    });
  } catch {
    return NextResponse.json(
      { error: "No pudimos cargar las asignaciones." },
      { status: 500 },
    );
  }
}

type PersonToAssign = { adoId: string; displayName: string };

/** Convierte filas de asignación en ítems para el cálculo de sobreasignación. */
function toAllocationItems(rows: PersonProjectAssignmentRow[]): AllocationItem[] {
  return rows.map((r) => ({
    projectName: r.projectName,
    teamName: r.teamName,
    pct: r.assignmentPct,
    fromMs: startOfDay(r.validFrom).getTime(),
    toMs: r.validTo ? endOfDay(r.validTo).getTime() : null,
  }));
}

function resolveAssignees(
  data: {
    personAdoId: string;
    personDisplayName: string;
    personAdoIds?: string[];
    teamId?: string | null;
    teamName?: string | null;
  },
  members: { id: string; displayName: string }[] = [],
): PersonToAssign[] {
  if (data.personAdoIds && data.personAdoIds.length > 0) {
    if (data.personAdoIds.length === 1) {
      const single = data.personAdoIds[0];
      const match = members.find((m) => m.id === single);
      return [{ adoId: single, displayName: match?.displayName ?? data.personDisplayName }];
    }
    return data.personAdoIds.map((adoId) => {
      const match = members.find((m) => m.id === adoId);
      return {
        adoId,
        displayName: match?.displayName ?? data.personDisplayName,
      };
    });
  }
  return [
    { adoId: data.personAdoId, displayName: data.personDisplayName },
  ];
}

export async function POST(req: Request) {
  const auth = await requireManagementUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: USER_MESSAGES.invalidJsonBody }, { status: 400 });
  }

  const parsed = createAssignmentBodySchema.safeParse(body);
  if (!parsed.success) {
    const firstCode = parsed.error.issues[0]?.message as AssignmentErrorCode | undefined;
    const safeCode: AssignmentErrorCode = firstCode ?? ASSIGNMENT_ERROR_CODES.roleRequired;
    return failResponse(codeToKey(safeCode), safeCode);
  }

  const isBulk =
    Array.isArray(parsed.data.personAdoIds) &&
    parsed.data.personAdoIds.length > 1;

  let membersForNames: { id: string; displayName: string }[] = [];
  if (
    isBulk &&
    parsed.data.teamId &&
    parsed.data.projectId
  ) {
    try {
      const { loadTeamMembers } = await import("@/lib/filters/load-team-members");
      membersForNames = await loadTeamMembers({
        project: parsed.data.projectName,
        team: parsed.data.teamName ?? "",
      });
    } catch {
      membersForNames = [];
    }
  }

  const assignees = resolveAssignees(parsed.data, membersForNames);
  const repo = getRepositories().personProjectAssignment;
  const created: { adoId: string; id?: string }[] = [];

  for (const person of assignees) {
    const overlapping = await repo.listOverlappingForPerson({
      personAdoId: person.adoId,
      from: new Date(parsed.data.validFrom),
      to: parsed.data.validTo ? new Date(parsed.data.validTo) : null,
    });

    const result = validateNewAssignment({
      candidate: {
        projectId: parsed.data.projectId,
        teamId: parsed.data.teamId ?? null,
        validFrom: new Date(parsed.data.validFrom),
        validTo: parsed.data.validTo ? new Date(parsed.data.validTo) : null,
        assignmentPct: parsed.data.assignmentPct,
      },
      overlapping,
    });
    if (!result.ok) {
      if (result.code === "over100") {
        const check = checkOverAllocation({
          personDisplayName: person.displayName,
          others: toAllocationItems(overlapping),
          candidate: {
            fromMs: startOfDay(new Date(parsed.data.validFrom)).getTime(),
            toMs: parsed.data.validTo
              ? endOfDay(new Date(parsed.data.validTo)).getTime()
              : null,
            pct: parsed.data.assignmentPct,
            projectName: parsed.data.projectName,
            teamName: parsed.data.teamName ?? null,
          },
        });
        return NextResponse.json(
          {
            error: check.ok ? ASSIGNMENT_USER_MESSAGES.over100 : check.message,
            code: ASSIGNMENT_ERROR_CODES.over100,
            currentTotal: check.ok ? result.currentTotal : check.total,
            conflictingPct: result.conflictingPct,
          },
          { status: ASSIGNMENT_HTTP_STATUS.over100 },
        );
      }
      return failWithContext(
        result.code,
        ASSIGNMENT_ERROR_CODES[result.code],
        {
          currentTotal: result.currentTotal,
          conflictingPct: result.conflictingPct,
        },
      );
    }

    try {
      const row = await repo.create({
        personAdoId: person.adoId,
        personDisplayName: person.displayName,
        projectId: parsed.data.projectId,
        projectName: parsed.data.projectName,
        teamId: parsed.data.teamId ?? null,
        teamName: parsed.data.teamName ?? null,
        roleId: parsed.data.roleId ?? null,
        assignmentPct: parsed.data.assignmentPct,
        assignedMonth: parsed.data.assignedMonth ?? null,
        validFrom: new Date(parsed.data.validFrom),
        validTo: parsed.data.validTo ? new Date(parsed.data.validTo) : null,
        createdByUserId: auth.userId,
      });
      created.push({ adoId: person.adoId, id: row.id });
    } catch {
      return NextResponse.json(
        { error: "No pudimos guardar la asignación." },
        { status: 500 },
      );
    }
  }

  if (created.length === 1 && created[0].id) {
    const enriched = await repo.findByIdWithRole(created[0].id);
    return NextResponse.json(
      {
        assignment: enriched ? assignmentRowToDto(enriched) : null,
        createdCount: created.length,
      },
      { status: 201 },
    );
  }

  const enrichedIds = created
    .map((c) => c.id)
    .filter((id): id is string => Boolean(id));
  if (enrichedIds.length === 0) {
    return NextResponse.json(
      { createdCount: created.length, assignments: [] },
      { status: 201 },
    );
  }
  const enrichedRows = await Promise.all(
    enrichedIds.map((id) => repo.findByIdWithRole(id)),
  );
  return NextResponse.json(
    {
      createdCount: created.length,
      assignments: enrichedRows
        .filter((row): row is NonNullable<typeof row> => row !== null)
        .map((row) => assignmentRowToDto(row)),
    },
    { status: 201 },
  );
}
