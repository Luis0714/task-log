import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { getRepositories, isUserPersistenceReady } from "@/lib/db";
import {
  workItemFiltersSchema,
  type WorkItemFilters,
} from "@/lib/schemas/work-item-filters";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

export const dynamic = "force-dynamic";

const scopeSchema = z.enum(["work-items", "time-log"]);

const putBodySchema = z.object({
  scope: scopeSchema,
  filters: workItemFiltersSchema,
});

export async function GET(req: Request) {
  if (!isIronSessionConfigured() || !isUserPersistenceReady()) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId;
  if (!userId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const url = new URL(req.url);
  const scopeResult = scopeSchema.safeParse(url.searchParams.get("scope"));
  if (!scopeResult.success) {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidPayload },
      { status: 400 },
    );
  }

  try {
    const filters = await getRepositories().userFilterPreferences.getByUserAndScope(
      userId,
      scopeResult.data,
    );
    return NextResponse.json({ filters: filters satisfies WorkItemFilters | null });
  } catch {
    return NextResponse.json(
      { error: "No pudimos cargar los filtros guardados." },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  console.log("[filter-prefs.api] PUT received");
  if (!isIronSessionConfigured() || !isUserPersistenceReady()) {
    console.warn("[filter-prefs.api] persistence not ready");
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId;
  console.log("[filter-prefs.api] userId from session:", userId);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
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

  console.log("[filter-prefs.api] body parsed", body);

  const parsed = putBodySchema.safeParse(body);
  if (!parsed.success) {
    console.warn("[filter-prefs.api] zod failed", parsed.error.issues);
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidPayload },
      { status: 400 },
    );
  }

  try {
    await getRepositories().userFilterPreferences.upsert(
      userId,
      parsed.data.scope,
      parsed.data.filters,
    );
    console.log("[filter-prefs.api] upsert ok", {
      userId,
      scope: parsed.data.scope,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[filter-prefs.api] upsert error", error);
    return NextResponse.json(
      { error: "No pudimos guardar los filtros predeterminados." },
      { status: 500 },
    );
  }
}
