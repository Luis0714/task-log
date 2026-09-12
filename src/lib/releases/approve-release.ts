import "server-only";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { approveAdoReleaseApproval } from "@/lib/azure-devops/releases";

export type ApproveReleaseInput = {
  project: string;
  approvalId: number;
};

export async function approveRelease(input: ApproveReleaseInput): Promise<void> {
  const auth = await getScopedProjectAuth(input.project);
  if (!auth) {
    throw new Error("No hay conexión con Azure DevOps.");
  }

  await approveAdoReleaseApproval(
    auth,
    input.approvalId,
    "Aprobado desde NeosView.",
  );
}
