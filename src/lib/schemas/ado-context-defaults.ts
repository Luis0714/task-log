import { z } from "zod";

export const saveAdoContextDefaultsSchema = z.object({
  project: z.string().trim().min(1, "Selecciona un proyecto."),
  team: z.string().trim().min(1, "Selecciona un equipo."),
});

export type SaveAdoContextDefaultsInput = z.infer<typeof saveAdoContextDefaultsSchema>;
