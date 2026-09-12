import { Rocket } from "lucide-react";

import { Empty } from "@/components/ui/empty";
import { EmptyDescription } from "@/components/ui/empty-description";
import { EmptyHeader } from "@/components/ui/empty-header";
import { EmptyMedia } from "@/components/ui/empty-media";
import { EmptyTitle } from "@/components/ui/empty-title";
import {
  RELEASE_EMPTY_DESCRIPTION,
  RELEASE_EMPTY_FILTERED_DESCRIPTION,
  RELEASE_EMPTY_FILTERED_TITLE,
  RELEASE_EMPTY_TITLE,
} from "@/lib/releases/copy";

export type ReleaseEmptyProps = {
  hasActiveFilters?: boolean;
};

export function ReleaseEmpty({ hasActiveFilters = false }: ReleaseEmptyProps) {
  return (
    <Empty className="min-h-56">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Rocket />
        </EmptyMedia>
        <EmptyTitle>
          {hasActiveFilters ? RELEASE_EMPTY_FILTERED_TITLE : RELEASE_EMPTY_TITLE}
        </EmptyTitle>
        <EmptyDescription>
          {hasActiveFilters
            ? RELEASE_EMPTY_FILTERED_DESCRIPTION
            : RELEASE_EMPTY_DESCRIPTION}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
