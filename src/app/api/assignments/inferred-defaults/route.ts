import "server-only";

import { NextResponse } from "next/server";

import { getRepositories } from "@/lib/db";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { requireManagementUser } from "@/app/api/assignments/helpers";
import { z } from "zod";

export const dynamic = "force-dynamic";

const memberSchema = z.object({
  personAdoId: z.string().trim().min(1),
  personDisplayName: z.string().trim().min(1),
  projectId: z.string().trim().min(1),
  projectName: z.string().trim().min(1),
  teamId: z.string().trim().nullable(),
  teamName: z.string().trim().nullable(),
});

const bodySchema = z.object({
  members: z.array(memberSchema).max(5000),
});

export async function POST(req: Request) {
  const auth = await requireManagementUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidJsonBody },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidPayload },
      { status: 400 },
    );
  }

  try {
    const defaults = await getRepositories().personProjectAssignment.listInferredDefaults(
      { members: parsed.data.members },
    );
    return NextResponse.json({ defaults });
  } catch {
    return NextResponse.json(
      { error: "No pudimos calcular los slots por defecto." },
      { status: 500 },
    );
  }
}
