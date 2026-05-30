import "server-only";

import { NextResponse } from "next/server";
import type { ZodType } from "zod";

import { USER_MESSAGES } from "@/lib/errors/user-messages";

export type ParsedAuthPostBody<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

export async function parseAuthPostBody<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<ParsedAuthPostBody<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: USER_MESSAGES.invalidForm },
        { status: 400 },
      ),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidForm;
    return {
      ok: false,
      response: NextResponse.json({ error: message }, { status: 400 }),
    };
  }

  return { ok: true, data: parsed.data };
}
