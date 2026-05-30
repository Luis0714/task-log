import { z } from "zod";

export const loginLocalBodySchema = z.object({
  username: z.string().trim().min(1, "Indica tu usuario."),
  password: z.string().min(1, "Indica tu contraseña."),
});

export type LoginLocalBody = z.infer<typeof loginLocalBodySchema>;
