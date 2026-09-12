import { cn } from "@/lib/utils";

export type PullRequestTitleProps = {
  title: string;
  className?: string;
};

export function PullRequestTitle({ title, className }: PullRequestTitleProps) {
  return (
    <p className={cn("min-w-0 truncate text-sm font-medium", className)} title={title}>
      {title}
    </p>
  );
}
