import { beforeEach, describe, expect, it, vi } from "vitest";

import "@/lib/agent/features/log-work";

import type { AgentProvider, ChatRequest, ChatResponse } from "@/lib/agent/provider/provider.types";
import { runLogWorkFeature } from "@/lib/agent/features/log-work/runner";

type ProviderMock = AgentProvider & { chat: ReturnType<typeof vi.fn> };

function makeProvider(responses: ChatResponse[]): ProviderMock {
  let index = 0;
  return {
    name: "openai",
    defaultModel: "gpt-4o-mini",
    chat: vi.fn(async (_req: ChatRequest): Promise<ChatResponse> => {
      const next = responses[index] ?? responses[responses.length - 1];
      index += 1;
      return next!;
    }),
  };
}

function toolCall(name: string, args: unknown): ChatResponse {
  return {
    raw: "",
    parsed: undefined,
    model: "gpt-4o-mini",
    latencyMs: 10,
    toolCalls: [{ id: "call_1", name, arguments: args }],
  };
}

function clarificationToolCall(question: string): ChatResponse {
  return toolCall("needs_clarification", { question });
}

function unsupportedToolCall(reason: string): ChatResponse {
  return toolCall("unsupported", { reason });
}

describe("runLogWorkFeature", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("parses a single log_work_batch tool call", async () => {
    const provider = makeProvider([
      toolCall("log_work_batch", {
        items: [
          { workItemId: 1234, hours: 2, comment: "Revisando PR" },
        ],
      }),
    ]);
    const result = await runLogWorkFeature({
      message: "Registra 2h en #1234 revisando PR",
      model: "gpt-4o-mini",
      provider,
    });
    expect(result).toEqual({
      action: "log_work_batch",
      items: [{ action: "log_work", workItemId: 1234, hours: 2, comment: "Revisando PR" }],
    });
    expect(provider.chat).toHaveBeenCalledTimes(1);
  });

  it("parses a multi-item log_work_batch tool call", async () => {
    const provider = makeProvider([
      toolCall("log_work_batch", {
        items: [
          { workItemId: 1, hours: 1, comment: "A" },
          { workItemId: 2, hours: 2, comment: "B" },
        ],
      }),
    ]);
    const result = await runLogWorkFeature({
      message: "1h en #1 y 2h en #2",
      model: "gpt-4o-mini",
      provider,
    });
    if (result.action !== "log_work_batch") throw new Error("expected batch");
    expect(result.items).toHaveLength(2);
  });

  it("returns needs_clarification when the LLM invokes needs_clarification", async () => {
    const provider = makeProvider([clarificationToolCall("¿Cuántas horas?")]);
    const result = await runLogWorkFeature({
      message: "Trabaje en 1234",
      model: "gpt-4o-mini",
      provider,
    });
    expect(result).toEqual({
      action: "needs_clarification",
      question: "¿Cuántas horas?",
    });
  });

  it("returns unsupported when the LLM invokes unsupported", async () => {
    const provider = makeProvider([unsupportedToolCall("No es registro de horas")]);
    const result = await runLogWorkFeature({
      message: "¿Cómo está el clima?",
      model: "gpt-4o-mini",
      provider,
    });
    expect(result).toEqual({
      action: "unsupported",
      reason: "No es registro de horas",
    });
  });

  it("throws when the provider returns no tool calls", async () => {
    const provider = makeProvider([
      { raw: "", parsed: undefined, model: "gpt-4o-mini", latencyMs: 5 },
    ]);
    await expect(
      runLogWorkFeature({
        message: "Algo",
        model: "gpt-4o-mini",
        provider,
      }),
    ).rejects.toThrow(/no invocó ninguna herramienta/);
  });

  it("throws when the tool call name is unknown", async () => {
    const provider = makeProvider([toolCall("no_existo", {})]);
    await expect(
      runLogWorkFeature({
        message: "Algo",
        model: "gpt-4o-mini",
        provider,
      }),
    ).rejects.toThrow(/Herramienta desconocida/);
  });

  it("throws when the tool arguments are invalid", async () => {
    const provider = makeProvider([
      toolCall("log_work_batch", { items: [{ hours: -1 }] }),
    ]);
    await expect(
      runLogWorkFeature({
        message: "Algo",
        model: "gpt-4o-mini",
        provider,
      }),
    ).rejects.toThrow(/Argumentos inválidos/);
  });

  it("returns needs_clarification for empty messages without calling the provider", async () => {
    const provider = makeProvider([]);
    const result = await runLogWorkFeature({
      message: "   ",
      model: "gpt-4o-mini",
      provider,
    });
    expect(result.action).toBe("needs_clarification");
    expect(provider.chat).not.toHaveBeenCalled();
  });
});