export function buildPullRequestDetailHref(
  id: number,
  repository?: string,
): string {
  const params = new URLSearchParams();
  const repo = repository?.trim();
  if (repo) params.set("repository", repo);
  const search = params.toString();
  return search ? `/pull-requests/${id}?${search}` : `/pull-requests/${id}`;
}

export function parsePullRequestId(value: string): number | null {
  const id = Number.parseInt(value, 10);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}
