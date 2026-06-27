import { z } from "zod";

import { previewResultSchema } from "./agent";

const baseMessage = z.object({
  id: z.string().uuid(),
  at: z.string().datetime(),
});

const userMessageSchema = baseMessage.extend({
  role: z.literal("user"),
  content: z.string().min(1),
});

const assistantMessageSchema = baseMessage.extend({
  role: z.literal("assistant"),
  content: z.string().min(1),
});

const thinkingMessageSchema = baseMessage.extend({
  role: z.literal("thinking"),
  /** Streamed progress label (e.g. "Buscando historias…"). */
  label: z.string().optional(),
});

const previewMessageSchema = baseMessage.extend({
  role: z.literal("preview"),
  preview: previewResultSchema,
});

const successMessageSchema = baseMessage.extend({
  role: z.literal("success"),
  content: z.string().min(1),
});

const errorMessageSchema = baseMessage.extend({
  role: z.literal("error"),
  content: z.string().min(1),
});

export const conversationMessageSchema = z.discriminatedUnion("role", [
  userMessageSchema,
  assistantMessageSchema,
  thinkingMessageSchema,
  previewMessageSchema,
  successMessageSchema,
  errorMessageSchema,
]);

export type ConversationMessage = z.infer<typeof conversationMessageSchema>;
export type UserMessage = z.infer<typeof userMessageSchema>;
export type AssistantMessage = z.infer<typeof assistantMessageSchema>;
export type PreviewMessage = z.infer<typeof previewMessageSchema>;
