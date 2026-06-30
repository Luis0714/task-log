import { NextResponse } from "next/server";

import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { listTaskStates } from "@/lib/azure-devops/work-item-type-states";

export type TaskState = {
  name: string;
  color: string;
  category: string;
};

export type TaskStatesResponse = {
  states: TaskState[];
};

export async function GET(): Promise<NextResponse> {
  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) return NextResponse.json<TaskStatesResponse>({ states: [] });

  const states = await listTaskStates(auth);
  return NextResponse.json<TaskStatesResponse>({ states: [...states] });
}
