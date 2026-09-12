import { z } from "zod";

export const saveDefaultRepositorySchema = z.object({
  repository: z.string().trim().min(1, "Selecciona un repositorio."),
});

export type SaveDefaultRepositoryInput = z.infer<typeof saveDefaultRepositorySchema>;
