import { NextResponse } from "next/server";

import { registerLocalPatUser } from "@/lib/auth/register-local-pat-user";
import { requireUserPersistence } from "@/lib/auth/require-user-persistence";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { connectPatBodySchema } from "@/lib/schemas/connect-pat";

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

  const parsed = connectPatBodySchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidForm;
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const result = await registerLocalPatUser(parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      email: result.email,
      password: result.password,
      notice:
        "Guarda tu correo y contraseña de TaskPilot. No volverán a mostrarse.",
    });
  } catch {
    return NextResponse.json(
      { error: USER_MESSAGES.genericRetry },
      { status: 500 },
    );
  }
}
