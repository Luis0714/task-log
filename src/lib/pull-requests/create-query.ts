export const NEW_PULL_REQUEST_PATH = "/pull-requests/new";

export type NewPullRequestQuery = {
  repository: string;
  source: string;
  target: string;
};

export function buildNewPullRequestHref(
  query: Partial<NewPullRequestQuery> = {},
): string {
  const params = new URLSearchParams();
  if (query.repository) params.set("repository", query.repository);
  if (query.source) params.set("source", query.source);
  if (query.target) params.set("target", query.target);
  const search = params.toString();
  return search ? `${NEW_PULL_REQUEST_PATH}?${search}` : NEW_PULL_REQUEST_PATH;
}

function readParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

export function parseNewPullRequestQuery(
  searchParams: Record<string, string | string[] | undefined>,
): NewPullRequestQuery {
  return {
    repository: readParam(searchParams.repository),
    source: readParam(searchParams.source),
    target: readParam(searchParams.target),
  };
}
