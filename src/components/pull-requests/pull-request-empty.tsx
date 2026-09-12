import Link from "next/link";
import { GitPullRequest, Plus } from "lucide-react";

import { Empty } from "@/components/ui/empty";
import { EmptyContent } from "@/components/ui/empty-content";
import { EmptyDescription } from "@/components/ui/empty-description";
import { EmptyHeader } from "@/components/ui/empty-header";
import { EmptyMedia } from "@/components/ui/empty-media";
import { EmptyTitle } from "@/components/ui/empty-title";
import { Button } from "@/components/ui/button";
import { CREATE_PULL_REQUEST_LABEL } from "@/lib/pull-requests/copy";

export type PullRequestEmptyProps = {
  hasActiveFilters?: boolean;
  createHref?: string;
};

export function PullRequestEmpty({
  hasActiveFilters = false,
  createHref,
}: PullRequestEmptyProps) {
  return (
    <Empty className="min-h-56">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <GitPullRequest />
        </EmptyMedia>
        <EmptyTitle>
          {hasActiveFilters ? "Ningún pull request coincide" : "No hay pull requests"}
        </EmptyTitle>
        <EmptyDescription>
          {hasActiveFilters
            ? "Prueba a cambiar los filtros o el texto de búsqueda."
            : "Cuando existan pull requests en los repositorios conectados, aparecerán aquí."}
        </EmptyDescription>
      </EmptyHeader>
      {createHref ? (
        <EmptyContent className="md:hidden">
          <Button
            type="button"
            nativeButton={false}
            render={<Link href={createHref} />}
          >
            <Plus />
            {CREATE_PULL_REQUEST_LABEL}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
