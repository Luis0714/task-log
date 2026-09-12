import { Empty } from "@/components/ui/empty";

export type PullRequestComparePanelPlaceholderProps = {
  title: string;
  description: string;
};

export function PullRequestComparePanelPlaceholder({
  title,
  description,
}: PullRequestComparePanelPlaceholderProps) {
  return (
    <Empty className="min-h-40">
      <p className="text-foreground font-medium">{title}</p>
      <p className="text-muted-foreground text-sm">{description}</p>
    </Empty>
  );
}
