import { NextResponse } from "next/server";

import { parseAuthPostBody } from "@/lib/auth/parse-auth-post-body";
import { registerLocalPatUser } from "@/lib/auth/register-local-pat-user";
import { requireUserPersistence } from "@/lib/auth/require-user-persistence";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { registerPatBodySchema } from "@/lib/schemas/register-pat";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const gate = requireUserPersistence();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  const parsed = await parseAuthPostBody(req, registerPatBodySchema);
  if (!parsed.ok) return parsed.response;

  try {
    const result = await registerLocalPatUser(parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: USER_MESSAGES.genericRetry },
      { status: 500 },
    );
  }
}
