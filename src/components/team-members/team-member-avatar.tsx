import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type TeamMemberAvatarSize = "sm" | "default" | "lg";

export type TeamMemberAvatarProps = Readonly<{
  /** Nombre del miembro. Se generan iniciales a partir del primer y último token. */
  name: string;
  size?: TeamMemberAvatarSize;
  className?: string;
  /** Texto accesible (alt). Default: `name`. */
  alt?: string;
}>;

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const last = parts.at(-1);
  if (!last) return "?";
  return (parts[0].charAt(0) + last.charAt(0)).toUpperCase();
}

/**
 * Avatar consistente para mostrar una persona del equipo (o un asignado
 * del sprint) en toda la app: filtros, responsables, tabla de tiempos.
 *
 * Render siempre las iniciales derivadas del nombre. No usamos foto de
 * ADO para evitar problemas de autenticación al cargar `<img src>`.
 */
export function TeamMemberAvatar({
  name,
  size = "default",
  className,
  alt,
}: TeamMemberAvatarProps) {
  const initials = initialsFrom(name);
  const altText = alt ?? name;

  return (
    <Avatar
      size={size}
      className={cn("shrink-0", className)}
      role="img"
      aria-label={altText}
    >
      <AvatarFallback aria-hidden>{initials}</AvatarFallback>
    </Avatar>
  );
}