import Link from "next/link";

import { PullRequestCreateForm } from "@/components/pull-requests/pull-request-create-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import type { NewPullRequestQuery } from "@/lib/pull-requests/create-query";

export type PullRequestCreateViewProps = {
  title: string;
  initialQuery: NewPullRequestQuery;
  defaultRepository: string | null;
  project: string | null;
  team: string | null;
};

export function PullRequestCreateView({
  title,
  initialQuery,
  defaultRepository,
  project,
  team,
}: PullRequestCreateViewProps) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <PageHeader
        title={title}
        description="Elige repositorio, ramas, revisores y work items. El repositorio predeterminado se rellena solo."
        action={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/pull-requests" />}
          >
            Volver al listado
          </Button>
        }
      />
      <PullRequestCreateForm
        initialQuery={initialQuery}
        defaultRepository={defaultRepository}
        project={project}
        team={team}
      />
    </div>
  );
}
