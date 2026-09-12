import { z } from "zod";

import { loginPasswordSchema } from "@/lib/schemas/taskpilot-password";

export const loginSuperAdminBodySchema = z.object({
  password: loginPasswordSchema,
});

export type LoginSuperAdminBody = z.infer<typeof loginSuperAdminBodySchema>;
