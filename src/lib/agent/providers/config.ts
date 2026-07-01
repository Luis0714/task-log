import type { ProviderId } from "./types";

export type ProviderIconKey = "openai" | "google";

export type ProviderConfig = {
  readonly id: ProviderId;
  readonly label: string;
  readonly description: string;
  readonly defaultModel: string;
  readonly free: boolean;
  /** Discriminator used by the client to resolve the brand icon component. */
  readonly iconKey: ProviderIconKey;
};

export const PROVIDER_CONFIGS = {
  openai: {
    id: "openai" as const,
    label: "OpenIA",
    description: "Respuestas más potentes",
    defaultModel: "gpt-4o-mini",
    free: false,
    iconKey: "openai" as const,
  },
  google: {
    id: "google" as const,
    label: "Google",
    description: "Acceso gratuito",
    defaultModel: "gemini-2.0-flash",
    free: true,
    iconKey: "google" as const,
  },
} satisfies Record<ProviderId, ProviderConfig>;

export const DEFAULT_PROVIDER_ID: ProviderId = "openai";
