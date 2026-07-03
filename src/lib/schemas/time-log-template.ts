import { z } from "zod";

/**
 * Validador compartido para `defaultHours` en todos los schemas de
 * plantilla (create / update / admin). El campo es opcional; cuando se
 * envía, debe ser > 0 y ≤ 24 (mismo rango que `hoursField` en time-log).
 */
const defaultHoursField = z
  .number()
  .positive("Las horas deben ser mayores a 0.")
  .max(24, "Máximo 24 horas.")
  .optional();

/**
 * Schema HTTP para crear una plantilla desde la UI.
 *
 * `defaultActivity` es opcional: si la UI tiene el valor del campo
 * `activity` del formulario en el momento de guardar, lo enviamos para que la
 * plantilla autocomplete también esa selección al aplicarla. Si llega vacío
 * o no se envía, no se asigna (la plantilla no forzará actividad al aplicarse).
 *
 * `defaultHours` es opcional: si se envía, autocompleta el campo "horas"
 * del formulario al aplicar la plantilla.
 *
 * `isGlobal` (opcional, default `false`): si es `true`, la plantilla se guarda
 * con `isSystem=true, seedKey="global"` y queda visible para todos los
 * usuarios. Sólo super_admin puede enviarlo en `true` (validación server-side).
 *
 * El campo `isGlobal` es **opcional** en la salida del parser (no lleva
 * `.default()`) para que callers no necesiten enviarlo cuando quieren una
 * plantilla personal — el server trata la ausencia como `false`.
 */
export const createTimeLogTemplateBodySchema = z.object({
  name: z.string().trim().min(1, "Ingresa un nombre para la plantilla.").max(80),
  defaultTitle: z
    .string()
    .trim()
    .min(1, "Ingresa el título por defecto.")
    .max(256, "Máximo 256 caracteres."),
  defaultDescription: z
    .string()
    .trim()
    .min(1, "Ingresa la descripción por defecto.")
    .max(2000, "Máximo 2000 caracteres."),
  defaultActivity: z
    .string()
    .trim()
    .max(80, "Máximo 80 caracteres.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  defaultHours: defaultHoursField,
  isGlobal: z.boolean().optional(),
});

export type CreateTimeLogTemplateBody = z.infer<
  typeof createTimeLogTemplateBodySchema
>;

/** Schema HTTP para editar una plantilla (mismos campos + isGlobal opcional). */
export const updateTimeLogTemplateBodySchema = createTimeLogTemplateBodySchema;

export type UpdateTimeLogTemplateBody = z.infer<
  typeof updateTimeLogTemplateBodySchema
>;

/**
 * Scopes que el super_admin puede asignar al crear/editar plantillas
 * desde `/admin/plantillas`.
 *
 * - `"personal"`        → plantilla personal del admin que la crea
 *                        (`user_id = currentAdmin`, `is_system = false`).
 * - `"developer" | "qa" | "designer" | "product-owner"` → plantillas
 *   scoped a un rol (`seedKey = scope`, `user_id = NULL`).
 * - `"global"`          → visible para todos los usuarios (`seedKey = "global"`).
 *
 * `scrum_master` y `product_manager` no entran porque `seedKeyForRoleName`
 * no les mapea un seedKey hoy.
 */
export const ADMIN_TEMPLATE_SCOPES = [
  "personal",
  "developer",
  "qa",
  "designer",
  "product-owner",
  "global",
] as const;

export type AdminTemplateScope = (typeof ADMIN_TEMPLATE_SCOPES)[number];

/**
 * Schema HTTP para que el super_admin cree una plantilla con scope
 * explícito. El server mapea `scope` a `isSystem=true` + `seedKey=scope`
 * y persiste con `user_id = NULL` (o `user_id = admin` si scope = "personal").
 */
export const adminCreateTimeLogTemplateBodySchema = z.object({
  name: z.string().trim().min(1, "Ingresa un nombre para la plantilla.").max(80),
  defaultTitle: z
    .string()
    .trim()
    .min(1, "Ingresa el título por defecto.")
    .max(256, "Máximo 256 caracteres."),
  defaultDescription: z
    .string()
    .trim()
    .min(1, "Ingresa la descripción por defecto.")
    .max(2000, "Máximo 2000 caracteres."),
  defaultActivity: z
    .string()
    .trim()
    .max(80, "Máximo 80 caracteres.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  defaultHours: defaultHoursField,
  scope: z.enum(ADMIN_TEMPLATE_SCOPES),
});

export type AdminCreateTimeLogTemplateBody = z.infer<
  typeof adminCreateTimeLogTemplateBodySchema
>;

export const adminUpdateTimeLogTemplateBodySchema =
  adminCreateTimeLogTemplateBodySchema;

export type AdminUpdateTimeLogTemplateBody = z.infer<
  typeof adminUpdateTimeLogTemplateBodySchema
>;

/** Payload devuelto al cliente (serializa fechas a string ISO). */
export type TimeLogTemplateDto = {
  id: string;
  name: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultActivity: string | null;
  /**
   * Horas por defecto (decimal). `null` = la plantilla no fuerza horas;
   * el usuario las ingresa al aplicar.
   */
  defaultHours: number | null;
  isSystem: boolean;
  seedKey: string | null;
  userId: string | null;
  /**
   * Nombre visible del usuario creador (`users.display_name`). `null` para
   * plantillas del sistema (sin autor humano). Si el JOIN no resuelve (p.ej.
   * usuario eliminado), el adapter envía cadena vacía y aquí queda `null`.
   */
  authorName: string | null;
  createdAt: string;
};

/** Scope visible de una plantilla en la UI. */
export type TemplateScope = "personal" | "global";

/**
 * Devuelve el scope visible de una plantilla: `global` si es una plantilla
 * del sistema con `seedKey === "global"`, `personal` en cualquier otro caso.
 */
export function templateScopeOf(
  template: Pick<TimeLogTemplateDto, "isSystem" | "seedKey">,
): TemplateScope {
  return template.isSystem && template.seedKey === "global"
    ? "global"
    : "personal";
}
