import "server-only";

import { NextResponse } from "next/server";

import { listAssignmentRoleOptions, requireManagementUser } from "@/app/api/assignments/helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireManagementUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const roles = await listAssignmentRoleOptions();
    return NextResponse.json({ roles });
  } catch {
    return NextResponse.json(
      { error: "No pudimos cargar los roles." },
      { status: 500 },
    );
  }
}
