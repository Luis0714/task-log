import { cn } from "@/lib/utils";

export type DiffStatProps = {
  additions: number;
  deletions: number;
  className?: string;
};

export function DiffStat({ additions, deletions, className }: DiffStatProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] tabular-nums",
        className,
      )}
    >
      {additions > 0 ? <span className="text-emerald-600">+{additions}</span> : null}
      {deletions > 0 ? <span className="text-rose-600">−{deletions}</span> : null}
    </span>
  );
}
