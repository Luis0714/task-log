import { formatWorkItemTypeAvatarInitials } from "@/lib/time-log/work-item-presentation";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "size-6 text-[9px]",
  default: "size-7 text-[10px]",
} as const;

export type WorkItemTypeAvatarProps = {
  type: string;
  size?: keyof typeof sizeClasses;
  className?: string;
};

export function WorkItemTypeAvatar({
  type,
  size = "default",
  className,
}: WorkItemTypeAvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "bg-primary/20 text-primary flex shrink-0 items-center justify-center rounded-full font-bold tracking-tight",
        sizeClasses[size],
        className,
      )}
    >
      {formatWorkItemTypeAvatarInitials(type)}
    </span>
  );
}
