import { z } from "zod";

/**
 * Schema HTTP para crear una plantilla desde la UI.
 *
 * `defaultActivity` es opcional: si la UI tiene el valor del campo
 * `activity` del formulario en el momento de guardar, lo enviamos para que la
 * plantilla autocomplete también esa selección al aplicarla. Si llega vacío
 * o no se envía, no se asigna (la plantilla no forzará actividad al aplicarse).
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
});

export type CreateTimeLogTemplateBody = z.infer<
  typeof createTimeLogTemplateBodySchema
>;

/** Payload devuelto al cliente (serializa fechas a string ISO). */
export type TimeLogTemplateDto = {
  id: string;
  name: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultActivity: string | null;
  isSystem: boolean;
  seedKey: string | null;
  userId: string | null;
  createdAt: string;
};
