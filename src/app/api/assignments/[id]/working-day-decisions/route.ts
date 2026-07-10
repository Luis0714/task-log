import "server-only";

import { NextResponse } from "next/server";

import { getRepositories } from "@/lib/db";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { requireManagementUser } from "@/app/api/assignments/helpers";
import { z } from "zod";

export const dynamic = "force-dynamic";

const decisionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD."),
  decision: z.enum(["habil_con_observacion", "no_habil"]),
  observation: z.string().trim().max(2000).nullable().optional(),
});

const bodySchema = z.object({
  decisions: z.array(decisionSchema).max(4000),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireManagementUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: USER_MESSAGES.invalidPayload }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: USER_MESSAGES.invalidJsonBody }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidPayload },
      { status: 400 },
    );
  }

  const repo = getRepositories().assignmentWorkingDayDecision;

  const habil = parsed.data.decisions.filter(
    (d) => d.decision === "habil_con_observacion",
  );
  for (const d of habil) {
    if (!d.observation || d.observation.trim() === "") {
      return NextResponse.json(
        {
          error:
            "Las decisiones de marcar como hábil requieren una observación que justifique el cambio.",
        },
        { status: 400 },
      );
    }
  }

  await repo.bulkUpsert({
    assignmentId: id,
    decisions: parsed.data.decisions.map((d) => ({
      date: d.date,
      decision: d.decision,
      observation: d.observation ?? null,
    })),
    createdByUserId: auth.userId,
  });

  return NextResponse.json({ ok: true, count: parsed.data.decisions.length });
}
