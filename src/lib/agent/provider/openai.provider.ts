import "server-only";

import type {
  AgentProvider,
  ChatRequest,
  ChatResponse,
} from "@/lib/agent/provider/provider.types";

const DEFAULT_TIMEOUT_MS = 15_000;
const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

export const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";

export const openaiProvider: AgentProvider = {
  name: "openai",
  defaultModel: process.env.OPENAI_MODEL?.trim() || OPENAI_DEFAULT_MODEL,
  async chat(req: ChatRequest): Promise<ChatResponse> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      throw new Error("OPENAI_API_KEY no está configurada.");
    }

    const body = buildRequestBody(req);
    const startedAt = Date.now();

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      req.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS,
    );

    let res: Response;
    try {
      res = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${errBody.slice(0, 200)}`);
    }

    return parseOpenAiResponse(res, req.model, startedAt);
  },
};

function buildRequestBody(req: ChatRequest): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: req.model,
    temperature: req.temperature,
    max_tokens: req.maxTokens ?? 800,
    messages: [
      { role: "system", content: req.systemPrompt },
      { role: "user", content: req.userMessage },
    ],
  };

  if (req.tools && req.tools.length > 0) {
    body.tools = req.tools.map((t) => ({
      type: "function",
      function: t,
    }));
    body.tool_choice = req.toolChoice ?? "auto";
  } else {
    body.response_format = { type: "json_object" };
  }

  return body;
}

async function parseOpenAiResponse(
  res: Response,
  fallbackModel: string,
  startedAt: number,
): Promise<ChatResponse> {
  const data = (await res.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
        tool_calls?: Array<{
          id: string;
          type?: string;
          function?: { name?: string; arguments?: string };
        }>;
      };
    }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
    model?: string;
  };

  const message = data.choices?.[0]?.message;
  const toolCalls = parseToolCalls(message?.tool_calls);
  const content = message?.content ?? undefined;

  if (toolCalls.length === 0 && !content) {
    throw new Error("OpenAI devolvió respuesta sin contenido.");
  }

  const usage = data.usage;
  return {
    raw: content ?? "",
    parsed: content ? safeJsonParse(content) : undefined,
    model: data.model ?? fallbackModel,
    latencyMs: Date.now() - startedAt,
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
    totalTokens: usage?.total_tokens,
    toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
  };
}

function parseToolCalls(
  raw: Array<{
    id: string;
    type?: string;
    function?: { name?: string; arguments?: string };
  }> | undefined,
) {
  if (!raw || raw.length === 0) return [];
  const result: Array<{ id: string; name: string; arguments: unknown }> = [];
  for (const call of raw) {
    const name = call.function?.name;
    if (!name) continue;
    const rawArgs = call.function?.arguments ?? "{}";
    let parsedArgs: unknown;
    try {
      parsedArgs = JSON.parse(rawArgs);
    } catch {
      parsedArgs = rawArgs;
    }
    result.push({ id: call.id, name, arguments: parsedArgs });
  }
  return result;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}