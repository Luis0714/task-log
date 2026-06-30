import { NextResponse } from "next/server";

import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { fetchActivityValues } from "@/lib/azure-devops/activity-values";

export type ActivityValuesResponse = {
  values: string[];
};

export async function GET(): Promise<NextResponse> {
  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) return NextResponse.json<ActivityValuesResponse>({ values: [] });

  const values = await fetchActivityValues(auth);
  return NextResponse.json<ActivityValuesResponse>({ values: [...values] });
}
