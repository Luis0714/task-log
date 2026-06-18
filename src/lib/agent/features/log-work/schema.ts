import { z } from "zod";

import {
  logWorkBatchSchema,
  logWorkItemSchema,
  needsClarificationPayloadSchema,
  unsupportedPayloadSchema,
} from "@/lib/schemas/agent";

export const logWorkOutputSchema = z.discriminatedUnion("action", [
  logWorkBatchSchema,
  needsClarificationPayloadSchema,
  unsupportedPayloadSchema,
]);

export { logWorkItemSchema };
export type { PreviewResult } from "@/lib/schemas/agent";