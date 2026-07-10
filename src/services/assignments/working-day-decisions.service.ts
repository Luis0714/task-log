import "client-only";

import type { AssignmentDto } from "@/lib/assignments/build-assignment-row";

export type WorkingDayDecisionDto = {
  date: string;
  decision: "habil_con_observacion" | "no_habil";
  observation: string | null;
};

export type SetDecisionsInput = {
  decisions: WorkingDayDecisionDto[];
};

async function parseError(res: Response): Promise<{ error: string }> {
  try {
    const body = (await res.json()) as { error?: string };
    return { error: body.error ?? `Error ${res.status}.` };
  } catch {
    return { error: `Error ${res.status}.` };
  }
}

export async function fetchColombianHolidays(
  year: number,
): Promise<{ date: string; name: string }[]> {
  const res = await fetch(`/api/holidays/co?year=${year}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error((await parseError(res)).error);
  }
  const body = (await res.json()) as {
    holidays: { date: string; name: string }[];
  };
  return body.holidays;
}

export async function setAssignmentWorkingDayDecisions(
  assignment: Pick<AssignmentDto, "id">,
  input: SetDecisionsInput,
): Promise<void> {
  const res = await fetch(
    `/api/assignments/${encodeURIComponent(assignment.id)}/working-day-decisions`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!res.ok) {
    throw new Error((await parseError(res)).error);
  }
}
