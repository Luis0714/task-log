export type BuildAdoPullRequestUrlParams = {
  organization: string;
  project: string;
  repository: string;
  pullRequestId: number;
};

function isUsableSegment(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed !== "—";
}

export function buildAdoPullRequestUrl({
  organization,
  project,
  repository,
  pullRequestId,
}: BuildAdoPullRequestUrlParams): string {
  if (
    !isUsableSegment(organization) ||
    !isUsableSegment(project) ||
    !isUsableSegment(repository) ||
    !Number.isFinite(pullRequestId) ||
    pullRequestId <= 0
  ) {
    return "";
  }

  return `https://dev.azure.com/${encodeURIComponent(organization.trim())}/${encodeURIComponent(project.trim())}/_git/${encodeURIComponent(repository.trim())}/pullrequest/${pullRequestId}`;
}

export function resolveAdoPullRequestUrl(
  organization: string | null | undefined,
  project: string | null | undefined,
  repository: string | null | undefined,
  pullRequestId: number | null | undefined,
): string | null {
  if (
    !organization ||
    !project ||
    !repository ||
    pullRequestId == null ||
    pullRequestId <= 0
  ) {
    return null;
  }

  const url = buildAdoPullRequestUrl({
    organization,
    project,
    repository,
    pullRequestId,
  });

  return url || null;
}
