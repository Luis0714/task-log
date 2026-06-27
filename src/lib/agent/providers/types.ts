export type ProviderId = "openai" | "google";

export type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

export type ProgressCallback = (label: string) => void;
