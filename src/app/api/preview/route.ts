import { NextResponse } from "next/server";
import { interpretUserMessage } from "@/lib/agent/interpret";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const message =
    typeof body === "object" && body !== null && "message" in body
      ? String((body as { message: unknown }).message ?? "")
      : "";

  try {
    const preview = await interpretUserMessage(message);
    return NextResponse.json({ preview });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al interpretar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
