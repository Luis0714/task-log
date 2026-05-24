import { cn } from "@/lib/utils";

const sizeClasses = {
  xs: "text-xs",
  sm: "text-xs",
  default: "text-xs",
} as const;

export type WorkItemIdProps = {
  id: number;
  size?: keyof typeof sizeClasses;
  className?: string;
};

export function WorkItemId({ id, size = "default", className }: WorkItemIdProps) {
  return (
    <span
      className={cn(
        "text-muted-foreground shrink-0 font-mono tabular-nums",
        sizeClasses[size],
        className,
      )}
    >
      #{id}
    </span>
  );
}
