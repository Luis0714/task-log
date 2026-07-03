import { z } from "zod";

export const connectPatBodySchema = z.object({
  pat: z.string().trim().min(1, "Pega tu código de acceso."),
  organization: z.string().trim().min(1, "Indica la organización."),
  project: z.string().trim().min(1, "Indica el proyecto."),
  team: z.string().trim().optional(),
});

export type ConnectPatBody = z.infer<typeof connectPatBodySchema>;
