import { TeamMemberAvatar } from "@/components/team-members/team-member-avatar";
import { getAssigneeTagClasses } from "@/lib/work-items/assignee-tag-colors";
import { cn } from "@/lib/utils";

export type WorkItemAssigneeTagProps = {
  name: string;
  className?: string;
  /**
   * Variante compacta: reduce el tamaño del avatar y el de sus iniciales
   * (el texto del nombre mantiene su tamaño). Útil en listas densas
   * (p. ej. módulo de historias de usuario).
   */
  compact?: boolean;
  /**
   * Si es `true`, no renderiza el avatar (solo el nombre).
   * Sobrescribe `compact` para la visibilidad del avatar.
   */
  hideAvatar?: boolean;
  /** Tamaño del avatar (clases Tailwind). Default: `size-3` (o `size-1.5` si `compact`). */
  avatarClassName?: string;
  /** Clases extra para el texto de las iniciales del avatar. */
  fallbackClassName?: string;
};

export function WorkItemAssigneeTag({
  name,
  className,
  compact = false,
  hideAvatar = false,
  avatarClassName,
  fallbackClassName,
}: WorkItemAssigneeTagProps) {
  const showAvatar = !hideAvatar;
  const avatarSize = avatarClassName ?? (compact ? "size-1.5" : "size-3");
  const avatarFallback = fallbackClassName ?? (compact ? "text-[7px]" : undefined);

  return (
    <span
      className={cn(
        "inline-flex min-w-0 max-w-30 shrink items-center rounded-full border py-0.5 text-[10px] font-medium",
        showAvatar ? (compact ? "gap-0.5 px-1.5" : "gap-1 px-2") : "px-2",
        getAssigneeTagClasses(name),
        className,
      )}
      title={name}
    >
      {showAvatar ? (
        <TeamMemberAvatar
          name={name}
          size="sm"
          className={avatarSize}
          fallbackClassName={avatarFallback}
        />
      ) : null}
      <span className="truncate">{name}</span>
    </span>
  );
}

export type WorkItemAssigneeLabelProps = {
  assignee: string | null | undefined;
  className?: string;
};

export function WorkItemAssigneeLabel({
  assignee,
  className,
}: WorkItemAssigneeLabelProps) {
  const name = assignee?.trim();
  if (name) {
    return <WorkItemAssigneeTag name={name} className={className} />;
  }

  return (
    <span
      className={cn(
        "text-muted-foreground inline-flex shrink-0 items-center gap-1 text-xs whitespace-nowrap",
        className,
      )}
    >
      <span>Sin asignar</span>
    </span>
  );
}