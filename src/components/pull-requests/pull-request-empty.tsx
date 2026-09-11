import { GitPullRequest } from "lucide-react";

import { Empty } from "@/components/ui/empty";
import { EmptyDescription } from "@/components/ui/empty-description";
import { EmptyHeader } from "@/components/ui/empty-header";
import { EmptyMedia } from "@/components/ui/empty-media";
import { EmptyTitle } from "@/components/ui/empty-title";

export type PullRequestEmptyProps = {
  hasActiveFilters?: boolean;
};

export function PullRequestEmpty({ hasActiveFilters = false }: PullRequestEmptyProps) {
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
    </Empty>
  );
}
