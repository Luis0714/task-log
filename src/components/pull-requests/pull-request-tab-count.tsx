export type PullRequestTabCountProps = {
  value: number;
};

export function PullRequestTabCount({ value }: PullRequestTabCountProps) {
  return (
    <span className="bg-muted text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] leading-none tabular-nums">
      {value}
    </span>
  );
}
