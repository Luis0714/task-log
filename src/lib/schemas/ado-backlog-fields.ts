import { z } from "zod";

export const backlogResponsableFieldSchema = z.object({
  key: z.enum(["maquetacion", "integrador", "qa"]),
  referenceName: z.string(),
  label: z.string(),
  defaultToCurrentUser: z.boolean(),
  source: z.enum(["env", "discovered"]),
  envKey: z.string(),
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
