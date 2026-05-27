export type BuildAdoWorkItemEditUrlParams = {
  organization: string;
  project: string;
  workItemId: number;
};

export function buildAdoWorkItemEditUrl({
  organization,
  project,
  workItemId,
}: BuildAdoWorkItemEditUrlParams): string {
  const org = organization.trim();
  const proj = project.trim();
  if (!org || !proj || !Number.isFinite(workItemId) || workItemId <= 0) {
    return "";
  }

  return `https://dev.azure.com/${encodeURIComponent(org)}/${encodeURIComponent(proj)}/_workitems/edit/${workItemId}`;
}

export function resolveAdoWorkItemEditUrl(
  organization: string | null | undefined,
  project: string | null | undefined,
  workItemId: number | null | undefined,
): string | null {
  if (!organization?.trim() || !project?.trim() || workItemId == null || workItemId <= 0) {
    return null;
  }

  const url = buildAdoWorkItemEditUrl({
    organization: organization.trim(),
    project: project.trim(),
    workItemId,
  });

  return url || null;
}
