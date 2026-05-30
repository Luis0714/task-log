import { z } from "zod";

import { taskPilotEmailSchema } from "@/lib/schemas/taskpilot-email";

export const loginLocalBodySchema = z.object({
  email: taskPilotEmailSchema,
  password: z.string().min(1, "Indica tu contraseña."),
});

export type LoginLocalBody = z.infer<typeof loginLocalBodySchema>;
