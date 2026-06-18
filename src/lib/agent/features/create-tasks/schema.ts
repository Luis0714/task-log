import { z } from "zod";

import {
  createTasksBatchSchema,
  needsClarificationPayloadSchema,
  unsupportedPayloadSchema,
} from "@/lib/schemas/agent";

export const createTasksOutputSchema = z.discriminatedUnion("action", [
  createTasksBatchSchema,
  needsClarificationPayloadSchema,
  unsupportedPayloadSchema,
]);

export type { CreateTaskBatchItem, CreateTasksBatch } from "@/lib/schemas/agent";