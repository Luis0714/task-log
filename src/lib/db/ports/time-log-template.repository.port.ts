import type { TimeLogTemplate } from "@/lib/db/schema";

export type TimeLogTemplateRow = TimeLogTemplate;

/**
 * Datos que el usuario envía al crear una plantilla nueva desde la UI.
 * La columna `isSystem` siempre se persiste como `false` y `seedKey` como
 * `null` en este flujo — son plantillas personalizadas del usuario.
 * `defaultActivity` es opcional: si llega vacío, se guarda como `null`.
 */
export type CreateTimeLogTemplateInput = {
  name: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultActivity?: string;
};

export interface TimeLogTemplateRepository {
  /**
   * Crea una plantilla personalizada del usuario. Siempre `isSystem=false`
   * y `seedKey=null`. La FK a `users.id` se enciende y se borra en cascada
   * si el usuario es eliminado.
   */
  create(
    userId: string,
    input: CreateTimeLogTemplateInput,
  ): Promise<TimeLogTemplateRow>;

  /**
   * Actualiza los campos editables de una plantilla del usuario. Falla con
   * NotFoundError si no existe o no pertenece al usuario. Nunca permite
   * editar plantillas del sistema (cuyo `user_id` es null).
   */
  updateForUser(
    userId: string,
    templateId: string,
    input: UpdateTimeLogTemplateInput,
  ): Promise<TimeLogTemplateRow>;

  /**
   * Elimina una plantilla del usuario. Falla con NotFoundError si no existe
   * o si la plantilla no pertenece al usuario. Nunca permite borrar una
   * plantilla del sistema (que tiene `user_id = null`).
   */
  deleteForUser(userId: string, templateId: string): Promise<void>;
}

/**
 * Datos que el usuario envía al editar una plantilla. Todos los campos son
 * requeridos porque la edición es completa (no se permiten cambios
 * parciales desde la UI).
 */
export type UpdateTimeLogTemplateInput = {
  name: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultActivity?: string;
};

export class TimeLogTemplateNotFoundError extends Error {
  constructor() {
    super("Plantilla no encontrada.");
    this.name = "TimeLogTemplateNotFoundError";
  }
}
