import { buildAdoPullRequestUrl } from "@/lib/azure-devops/pull-request-url";

export function ReviewTimesPullRequestLink({
  organization,
  project,
  repository,
  pullRequestId,
  title,
}: Readonly<{
  organization: string;
  project: string;
  repository: string;
  pullRequestId: number;
  title: string;
}>) {
  const href = buildAdoPullRequestUrl({
    organization,
    project,
    repository,
    pullRequestId,
  });
  const label = `#${pullRequestId} ${title}`;
  if (!href) return <span className="font-medium">{label}</span>;

  return (
    <a href={href} target="_blank" rel="noreferrer" className="font-medium hover:underline">
      {label}
    </a>
  );
}
