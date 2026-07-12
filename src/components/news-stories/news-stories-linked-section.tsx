"use client";

import type { NewsStoryValidationEntry } from "@/lib/news-stories/types";
import type { ProjectTeamNewsStory } from "@/lib/db";

import { LinkedSectionHeader } from "@/components/news-stories/linked-section-header";
import { LinkedValidationBanner } from "@/components/news-stories/linked-validation-banner";
import {
  LinkedEmptyState,
  LinkedList,
  LinkedSkeleton,
} from "@/components/news-stories/linked-list";
import { describeLinkedCount } from "@/components/news-stories/news-stories-linked-format";

export type NewsStoriesLinkedSectionProps = Readonly<{
  items: ReadonlyArray<ProjectTeamNewsStory>;
  loading: boolean;
  validationById: ReadonlyMap<string, NewsStoryValidationEntry>;
  validationLoading: boolean;
  validationError: string | null;
  /** Slot para el trigger que abre el diálogo "Vincular HU". */
  renderLinkTrigger?: () => React.ReactNode;
  onUnlink: (item: ProjectTeamNewsStory) => void;
  onRetryValidation: () => void;
}>;

/**
 * Composición pura de la sección "Historias de usuario vinculadas".
 *
 *   <LinkedSectionHeader>          ← título + subtítulo + loader + slot del trigger
 *   <LinkedValidationBanner?>      ← sólo si hay error de validación
 *   <LinkedSkeleton?|LinkedList?>
 *   donde LinkedEmptyState si no hay items y loading=false
 */
export function NewsStoriesLinkedSection({
  items,
  loading,
  validationById,
  validationLoading,
  validationError,
  renderLinkTrigger,
  onUnlink,
  onRetryValidation,
}: NewsStoriesLinkedSectionProps) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <LinkedSectionHeader
        subtitle={describeLinkedCount(items.length)}
        validationLoading={validationLoading}
        renderLinkTrigger={renderLinkTrigger}
      />

      {validationError ? (
        <LinkedValidationBanner error={validationError} onRetry={onRetryValidation} />
      ) : null}

      {renderLinkedBody({
        items,
        loading,
        validationById,
        onUnlink,
      })}
    </section>
  );
}

function renderLinkedBody(props: {
  items: ReadonlyArray<ProjectTeamNewsStory>;
  loading: boolean;
  validationById: ReadonlyMap<string, NewsStoryValidationEntry>;
  onUnlink: (item: ProjectTeamNewsStory) => void;
}) {
  if (props.loading) {
    return <LinkedSkeleton />;
  }
  if (props.items.length === 0) {
    return (
      <LinkedEmptyState description="Aún no hay historias de novedad vinculadas a este proyecto y equipo." />
    );
  }
  return (
    <LinkedList
      items={props.items}
      validationById={props.validationById}
      onUnlink={props.onUnlink}
    />
  );
}
