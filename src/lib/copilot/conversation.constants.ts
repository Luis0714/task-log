/** localStorage key for the persisted conversation (must be globally unique). */
export const CONVERSATION_STORAGE_KEY = "neos-ia-conversation";

/** Maximum number of ConversationMessages kept in localStorage. */
export const CONVERSATION_STORAGE_LIMIT = 60;

/**
 * Number of user/assistant turns sent to the LLM as prior context.
 * Keeps token usage predictable while giving the model enough history
 * to understand short follow-up replies ("8", "ayer", etc.).
 */
export const CONVERSATION_HISTORY_LIMIT = 10;

/**
 * Hard cap applied by the API route before forwarding history to the agent.
 * Slightly above the client limit so the server is permissive but bounded.
 */
export const CONVERSATION_HISTORY_SERVER_CAP = 12;
