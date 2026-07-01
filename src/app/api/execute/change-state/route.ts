import "server-only";

import { NextResponse } from "next/server";

import { updateBacklogItemState } from "@/lib/azure-devops/update-backlog-item-state";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";

type ChangeStateBody = {
  workItemId: number;
  toState: string;
  team?: string;
};

function parseBody(raw: unknown): ChangeStateBody | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.workItemId !== "number" || !Number.isInteger(obj.workItemId) || obj.workItemId <= 0) return null;
  if (typeof obj.toState !== "string" || !obj.toState.trim()) return null;
  return {
    workItemId: obj.workItemId,
    toState: obj.toState.trim(),
    team: typeof obj.team === "string" ? obj.team : undefined,
  };
}

export async function POST(req: Request) {
  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return NextResponse.json({ ok: false, error: "No autenticado con Azure DevOps." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const params = parseBody(body);
  if (!params) {
    return NextResponse.json({ ok: false, error: "Parámetros inválidos." }, { status: 400 });
  }

  const result = await updateBacklogItemState(
    { workItemId: params.workItemId, state: params.toState, team: params.team },
    auth,
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.body.slice(0, 300) || "No se pudo actualizar el estado." },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true, state: result.state });
}
