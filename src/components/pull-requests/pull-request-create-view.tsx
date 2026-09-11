import Link from "next/link";

import { PullRequestCreateForm } from "@/components/pull-requests/pull-request-create-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import type { NewPullRequestQuery } from "@/lib/pull-requests/create-query";

export type PullRequestCreateViewProps = {
  title: string;
  initialQuery: NewPullRequestQuery;
};

export function PullRequestCreateView({
  title,
  initialQuery,
}: PullRequestCreateViewProps) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <PageHeader
        title={title}
        description="Elige repositorio, rama origen y destino. Si llegas desde el aviso de rama reciente, el origen ya viene seleccionado."
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
      <PullRequestCreateForm initialQuery={initialQuery} />
    </div>
  );
}
