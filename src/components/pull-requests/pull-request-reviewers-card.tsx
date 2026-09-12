import { PullRequestReviewerRow } from "@/components/pull-requests/pull-request-reviewer-row";
import { PullRequestSideSection } from "@/components/pull-requests/pull-request-side-section";
import type { PullRequestDetailReviewer } from "@/lib/pull-requests/detail-types";

export type PullRequestReviewersCardProps = {
  reviewers: readonly PullRequestDetailReviewer[];
};

function ReviewerGroup({
  title,
  reviewers,
}: {
  title: string;
  reviewers: readonly PullRequestDetailReviewer[];
}) {
  return (
    <div>
      <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {title}
      </p>
      {reviewers.length === 0 ? (
        <p className="text-muted-foreground mt-1 text-xs">Ninguno</p>
      ) : (
        <ul>
          {reviewers.map((reviewer) => (
            <PullRequestReviewerRow key={reviewer.id} reviewer={reviewer} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function PullRequestReviewersCard({ reviewers }: PullRequestReviewersCardProps) {
  const required = reviewers.filter((reviewer) => reviewer.isRequired);
  const optional = reviewers.filter((reviewer) => !reviewer.isRequired);

  return (
    <PullRequestSideSection
      title="Revisores"
      empty={reviewers.length === 0}
      emptyLabel="Sin revisores"
    >
      <div className="flex flex-col gap-3">
        <ReviewerGroup title="Obligatorios" reviewers={required} />
        <ReviewerGroup title="Opcionales" reviewers={optional} />
      </div>
    </PullRequestSideSection>
  );
}
