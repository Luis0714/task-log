import { z } from "zod";

export const backlogResponsableFieldSchema = z.object({
  /** Identificador estable. Para campos genéricos, el `referenceName` mismo. */
  key: z.string(),
  referenceName: z.string(),
  label: z.string(),
  defaultToCurrentUser: z.boolean(),
  source: z.enum(["env", "discovered", "manual"]),
  envKey: z.string().nullable().optional(),
});

export const adoBacklogFieldsResponseSchema = z.object({
  workItemType: z.string(),
  fields: z.array(backlogResponsableFieldSchema),
  /** Campos del proceso cuyo nombre contiene "responsable" (ayuda a configurar .env). */
  responsableCandidates: z.array(
    z.object({
      referenceName: z.string(),
      name: z.string(),
    }),
  ),
});

export type BacklogResponsableFieldDto = z.infer<typeof backlogResponsableFieldSchema>;
export type AdoBacklogFieldsResponseDto = z.infer<typeof adoBacklogFieldsResponseSchema>;
