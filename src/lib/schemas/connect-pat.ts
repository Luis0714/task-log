import { z } from "zod";

export const connectPatBodySchema = z.object({
  organization: z.string().trim().min(1, "Indica la organización."),
  project: z.string().trim().min(1, "Indica el proyecto."),
  pat: z.string().trim().min(1, "Pega tu código de acceso."),
});

export type ConnectPatBody = z.infer<typeof connectPatBodySchema>;
