import { z } from "zod";

import { registerTool, type ToolHandler } from "@/lib/agent/tools/registry";
import type {
  NeedsClarificationPayload,
  UnsupportedPayload,
} from "@/lib/schemas/agent";

const NEEDS_CLARIFICATION_NAME = "needs_clarification";
const UNSUPPORTED_NAME = "unsupported";

const needsClarificationArgsSchema = z.object({
  question: z.string().min(1).max(500),
});

const unsupportedArgsSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const needsClarificationTool: ToolHandler<
  z.infer<typeof needsClarificationArgsSchema>,
  NeedsClarificationPayload
> = {
  definition: {
    name: NEEDS_CLARIFICATION_NAME,
    description:
      "Devuelve esta herramienta cuando falta información esencial (work item ID, horas, descripción del trabajo). Formula UNA pregunta concreta y breve.",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          minLength: 1,
          maxLength: 500,
          description: "Pregunta breve pidiendo exactamente lo que falta.",
        },
      },
      required: ["question"],
      additionalProperties: false,
    },
  },
  argsSchema: needsClarificationArgsSchema,
  outputSchema: z.object({
    action: z.literal("needs_clarification"),
    question: z.string().min(1).max(500),
    candidates: z
      .array(
        z.object({
          id: z.number().int().positive(),
          title: z.string().min(1).max(500),
          state: z.string().min(1).max(100).optional(),
        }),
      )
      .min(1)
      .max(8)
      .optional(),
  }),
  handle: (args): NeedsClarificationPayload => ({
    action: "needs_clarification",
    question: args.question,
  }),
};

export const unsupportedTool: ToolHandler<
  z.infer<typeof unsupportedArgsSchema>,
  UnsupportedPayload
> = {
  definition: {
    name: UNSUPPORTED_NAME,
    description:
      "Devuelve esta herramienta cuando la intención del usuario NO es registrar trabajo (charla general, preguntas, etc.). Indica brevemente por qué no aplica.",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          minLength: 1,
          maxLength: 500,
          description: "Razón breve por la que no aplica.",
        },
      },
      required: ["reason"],
      additionalProperties: false,
    },
  },
  argsSchema: unsupportedArgsSchema,
  outputSchema: z.object({
    action: z.literal("unsupported"),
    reason: z.string().min(1).max(500),
  }),
  handle: (args): UnsupportedPayload => ({
    action: "unsupported",
    reason: args.reason,
  }),
};

registerTool(needsClarificationTool);
registerTool(unsupportedTool);

export const SHARED_TOOL_NAMES = [
  NEEDS_CLARIFICATION_NAME,
  UNSUPPORTED_NAME,
] as const;