import "server-only";

import { fetchAuthorNames } from "@/lib/db/adapters/drizzle/drizzle-time-log-template.repository";
import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";
import { templateRowToDto } from "@/lib/time-log/template-dto";

export { requireSuperAdminSession, type SuperAdminSession } from "@/app/api/admin/_shared/super-admin-session";

/**
 * DTO de plantilla resolviendo `authorName` con un lookup puntual: las rutas
 * admin pueden actuar sobre plantillas personales (con userId) cuyo autor no
 * es el usuario actual.
 */
export async function templateRowToDtoWithAuthor(
  row: Parameters<typeof templateRowToDto>[0],
): Promise<TimeLogTemplateDto> {
  const authorNames = row.userId
    ? await fetchAuthorNames([row.userId])
    : new Map<string, string>();
  return templateRowToDto(
    row,
    row.userId ? authorNames.get(row.userId) ?? null : null,
  );
}