import { NextResponse } from "next/server";

import { getDeploymentHealthReport } from "@/lib/health/deployment-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await getDeploymentHealthReport();

  return NextResponse.json(report, {
    status: report.ok ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
