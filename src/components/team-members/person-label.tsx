import { TeamMemberAvatar } from "@/components/team-members/team-member-avatar";
import { cn } from "@/lib/utils";

export type PersonLabelProps = {
  name: string;
  className?: string;
};

export function PersonLabel({ name, className }: PersonLabelProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)} title={name}>
      <TeamMemberAvatar name={name} size="sm" className="size-4" fallbackClassName="text-[8px]" />
      <span className="truncate text-[11px]">{name}</span>
    </span>
  );
}
