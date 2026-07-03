import type { TimeLogTemplate } from "@/lib/db/schema";
import type { AdminTemplateScope } from "@/lib/schemas/time-log-template";

export type TimeLogTemplateRow = TimeLogTemplate;

/**
 * Datos que el usuario envía al crear una plantilla nueva desde la UI.
 * Si `isGlobal === true`, se persiste como `isSystem=true, seedKey="global"`
 * (visible para todos); este flag sólo lo puede enviar un super_admin
 * (validación server-side). Por default `false` → plantilla personal.
 * `defaultActivity` es opcional: si llega vacío, se guarda como `null`.
 * `defaultHours` es opcional: si se envía, autocompleta el campo horas al
 * aplicar la plantilla; si no, queda null.
 */
export type CreateTimeLogTemplateInput = {
  name: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultActivity?: string;
  defaultHours?: number;
  isGlobal?: boolean;
};

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
  defaultHours?: number;
  isGlobal?: boolean;
};

/**
 * Datos para que el super_admin cree una plantilla con scope explícito.
 * - `scope = "personal"` → se persiste como plantilla personal del admin
 *   (`user_id = currentAdminId`, `is_system = false`, `seed_key = NULL`).
 * - `scope = "developer" | "qa" | "designer" | "product-owner" | "global"`
 *   → se persiste como plantilla del sistema (`user_id = NULL`,
 *   `is_system = true`, `seed_key = scope`).
 */
export type AdminCreateTimeLogTemplateInput = {
  name: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultActivity?: string;
  defaultHours?: number;
  scope: AdminTemplateScope;
};

export interface TimeLogTemplateRepository {
  /**
   * Crea una plantilla. Si `input.isGlobal === true`, persiste con
   * `isSystem=true, seedKey="global"` (visible para todos). Si no, plantilla
   * personalizada del usuario (`isSystem=false, seedKey=null`).
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

  /**
   * Lista TODAS las plantillas del workspace (cualquier scope).
   * Usado sólo por el super_admin desde `/admin/plantillas`.
   * Hace LEFT JOIN con `users` para incluir el displayName del autor.
   */
  adminListAll(): Promise<
    Array<TimeLogTemplateRow & { authorDisplayName: string | null }>
  >;

  /**
   * Crea una plantilla administrada.
   *
   * Si `input.scope === "personal"`, persiste con `userId = currentAdminId`,
   * `isSystem = false`, `seedKey = NULL`. Para cualquier otro scope,
   * persiste con `userId = NULL`, `isSystem = true`, `seedKey = scope`.
   */
  adminCreate(
    currentAdminId: string,
    input: AdminCreateTimeLogTemplateInput,
  ): Promise<TimeLogTemplateRow>;

  /**
   * Actualiza una plantilla administrada por id. Puede modificar el scope
   * (incluso entre personal / role / global). Falla con NotFoundError si
   * no existe.
   */
  adminUpdate(
    currentAdminId: string,
    id: string,
    input: AdminCreateTimeLogTemplateInput,
  ): Promise<TimeLogTemplateRow>;

  /**
   * Elimina una plantilla administrada por id. Falla con NotFoundError
   * si no existe.
   */
  adminDelete(id: string): Promise<void>;
}

export class TimeLogTemplateNotFoundError extends Error {
  constructor() {
    super("Plantilla no encontrada.");
    this.name = "TimeLogTemplateNotFoundError";
  }
}
