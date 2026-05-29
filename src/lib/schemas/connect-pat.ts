import { z } from "zod";

export const connectPatBodySchema = z.object({
  pat: z.string().trim().min(1, "Pega tu código de acceso."),
});

export type ConnectPatBody = z.infer<typeof connectPatBodySchema>;
