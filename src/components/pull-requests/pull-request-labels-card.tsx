import { Badge } from "@/components/ui/badge";
import { PullRequestSideSection } from "@/components/pull-requests/pull-request-side-section";

export type PullRequestLabelsCardProps = {
  labels: readonly string[];
};

export function PullRequestLabelsCard({ labels }: PullRequestLabelsCardProps) {
  return (
    <PullRequestSideSection
      title="Etiquetas"
      empty={labels.length === 0}
      emptyLabel="Sin etiquetas"
    >
      <div className="flex flex-wrap gap-1.5">
        {labels.map((label) => (
          <Badge key={label} variant="outline">
            {label}
          </Badge>
        ))}
      </div>
    </PullRequestSideSection>
  );
}
