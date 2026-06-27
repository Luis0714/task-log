import "server-only";

import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

import { PROVIDER_CONFIGS, DEFAULT_PROVIDER_ID } from "./config";
import type { ProviderId } from "./types";

export function resolveLanguageModel(id?: ProviderId | null): LanguageModel {
  const providerId = id ?? DEFAULT_PROVIDER_ID;
  switch (providerId) {
    case "openai":
      return openai(process.env.OPENAI_MODEL?.trim() || PROVIDER_CONFIGS.openai.defaultModel);
    case "google":
      return google(process.env.GOOGLE_MODEL?.trim() || PROVIDER_CONFIGS.google.defaultModel);
  }
}
