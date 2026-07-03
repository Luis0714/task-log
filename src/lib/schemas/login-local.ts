import { z } from "zod";

import { taskPilotEmailSchema } from "@/lib/schemas/taskpilot-email";
import { loginPasswordSchema } from "@/lib/schemas/taskpilot-password";

export const loginLocalBodySchema = z.object({
  email: taskPilotEmailSchema,
  password: loginPasswordSchema,
});

export type LoginLocalBody = z.infer<typeof loginLocalBodySchema>;
