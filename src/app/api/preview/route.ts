import { NextResponse } from "next/server";

import { interpretUserMessage } from "@/lib/agent/interpret";
import { mapErrorToUserMessage } from "@/lib/errors/map-error-to-user-message";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidForm },
      { status: 400 },
    );
  }

  const message =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as { message: unknown }).message ?? "")
      : "";

  try {
    const preview = await interpretUserMessage(message);
    return NextResponse.json({ preview });
  } catch (error) {
    console.error("[preview]", error);
    return NextResponse.json(
      {
        error: mapErrorToUserMessage(error, USER_MESSAGES.copilotInterpret),
      },
      { status: 500 },
    );
  }
}
