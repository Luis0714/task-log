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

/** Semantic keys the server sends so the client can render the right icon. */
export const THINKING_ICON_KINDS = [
  "thinking",
  "search",
  "found",
  "logging",
] as const;

export type ThinkingIconKind = (typeof THINKING_ICON_KINDS)[number];

const thinkingMessageSchema = baseMessage.extend({
  role: z.literal("thinking"),
  /** Streamed progress label (e.g. "Buscando historias…"). Plain text — no
   *  emoji. The icon is chosen client-side from `iconKind`. */
  label: z.string().optional(),
  /** Icon hint for the client. See THINKING_ICON_KINDS for valid values. */
  iconKind: z.enum(THINKING_ICON_KINDS).optional(),
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
