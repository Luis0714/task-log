import { NextResponse } from "next/server";

import { loginLocalUser } from "@/lib/auth/login-local-user";
import { requireUserPersistence } from "@/lib/auth/require-user-persistence";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { loginLocalBodySchema } from "@/lib/schemas/login-local";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const gate = requireUserPersistence();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: USER_MESSAGES.invalidForm }, { status: 400 });
  }

  const parsed = loginLocalBodySchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidForm;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const result = await loginLocalUser(parsed.data);
    if (!result.ok) {
      const status =
        result.reason === "invalid_credentials" || result.reason === "user_not_found"
          ? 401
          : 400;
      return NextResponse.json(
        { error: result.message, reason: result.reason },
        { status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: USER_MESSAGES.genericRetry },
      { status: 500 },
    );
  }
}
