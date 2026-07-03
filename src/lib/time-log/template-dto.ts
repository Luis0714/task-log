import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";

/**
 * Tipo crudo que el adapter (`drizzle-time-log-template.repository`) devuelve
 * para una fila de `time_log_templates`. No incluye `authorName` (eso lo añade
 * el caller vía lookup).
 */
export type TemplateRowForDto = {
  id: string;
  name: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultActivity: string | null;
  defaultHours: number | null;
  isSystem: boolean;
  seedKey: string | null;
  userId: string | null;
  createdAt: Date | string;
};

export type TemplateRowWithAuthor = TemplateRowForDto & {
  /** Resultado del LEFT JOIN con `users.displayName` (admin) o `null` (sistema). */
  authorDisplayName: string | null;
};

/**
 * Mapea una fila cruda del adapter al DTO que se envía al cliente.
 * Centraliza la serialización de fechas (Date → ISO) y aplica el nombre del
 * autor cuando viene del LEFT JOIN (admin) o de un lookup puntual.
 */
export function templateRowToDto(
  row: TemplateRowForDto | TemplateRowWithAuthor,
  authorName: string | null,
): TimeLogTemplateDto {
  return {
    id: row.id,
    name: row.name,
    defaultTitle: row.defaultTitle,
    defaultDescription: row.defaultDescription,
    defaultActivity: row.defaultActivity,
    defaultHours: row.defaultHours ?? null,
    isSystem: row.isSystem,
    seedKey: row.seedKey,
    userId: row.userId,
    authorName,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}
