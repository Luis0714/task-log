import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type TeamMemberAvatarSize = "sm" | "default" | "lg";

export type TeamMemberAvatarProps = {
  member: {
    displayName: string;
    imageUrl?: string;
  };
  size?: TeamMemberAvatarSize;
  className?: string;
  /** Texto accesible (alt). Default: `displayName`. */
  alt?: string;
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

/**
 * Avatar consistente para mostrar una persona del roster (o un asignado
 * del sprint) en toda la app: filtros, responsables, tabla de tiempos.
 *
 * Si la persona tiene `imageUrl`, muestra la foto real; en cualquier otro
 * caso usa iniciales derivadas de `displayName` como fallback.
 */
export function TeamMemberAvatar({
  member,
  size = "default",
  className,
  alt,
}: TeamMemberAvatarProps) {
  const initials = initialsFrom(member.displayName);
  const altText = alt ?? member.displayName;

  return (
    <Avatar size={size} className={cn("shrink-0", className)}>
      {member.imageUrl ? (
        <AvatarImage src={member.imageUrl} alt={altText} />
      ) : null}
      <AvatarFallback aria-hidden>{initials}</AvatarFallback>
    </Avatar>
  );
}