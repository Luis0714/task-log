import type { z } from "zod";

import { connectPatBodySchema } from "@/lib/schemas/connect-pat";
import { taskPilotEmailSchema } from "@/lib/schemas/taskpilot-email";
import { registerPasswordSchema } from "@/lib/schemas/taskpilot-password";

export const registerPatBodySchema = connectPatBodySchema.extend({
  email: taskPilotEmailSchema,
  password: registerPasswordSchema,
});

export type RegisterPatBody = z.infer<typeof registerPatBodySchema>;
