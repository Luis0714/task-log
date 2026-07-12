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

function toolCall(name: string, args: unknown, id = "call_1"): ChatResponse {
  return {
    raw: "",
    parsed: undefined,
    model: "gpt-4o-mini",
    latencyMs: 10,
    toolCalls: [{ id, name, arguments: args }],
    rawToolCalls: [{ id, type: "function", function: { name, arguments: JSON.stringify(args) } }],
  };
}

function clarificationToolCall(question: string): ChatResponse {
  return toolCall("needs_clarification", { question });
}

function unsupportedToolCall(reason: string): ChatResponse {
  return toolCall("unsupported", { reason });
}

const VALID_TASK = {
  pbiId: 1234,
  pbiTitle: "Historia de exportación",
  title: "Implementación endpoint de exportación",
  hours: 3,
  description: "Implementé el endpoint REST de exportación de datos",
  workingDate: "2026-06-23",
  workingTime: "09:00",
  state: "Closed",
  markAsDone: true,
  sprintPath: "MyProject\\Sprint 1",
  team: "MyTeam",
};

describe("runLogWorkFeature", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("parses a single create_tasks_batch tool call", async () => {
    const provider = makeProvider([
      toolCall("create_tasks_batch", { tasks: [VALID_TASK] }),
    ]);
    const result = await runLogWorkFeature({
      message: "Registra 3h en #1234 implementando el endpoint de exportación",
      model: "gpt-4o-mini",
      provider,
    });
    expect(result.action).toBe("create_tasks_batch");
    if (result.action !== "create_tasks_batch") throw new Error("expected batch");
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]!.pbiId).toBe(1234);
    expect(result.tasks[0]!.hours).toBe(3);
    expect(provider.chat).toHaveBeenCalledTimes(1);
  });

  it("parses a multi-task create_tasks_batch (activity split)", async () => {
    const provider = makeProvider([
      toolCall("create_tasks_batch", {
        tasks: [
          { ...VALID_TASK, title: "Implementación backend", hours: 4, activity: "Development" },
          { ...VALID_TASK, title: "Pruebas", hours: 2, activity: "QA" },
        ],
      }),
    ]);
    const result = await runLogWorkFeature({
      message: "4h implementando el backend y 2h haciendo pruebas en #1234",
      model: "gpt-4o-mini",
      provider,
    });
    if (result.action !== "create_tasks_batch") throw new Error("expected batch");
    expect(result.tasks).toHaveLength(2);
  });

  it("returns needs_clarification when the LLM invokes needs_clarification", async () => {
    const provider = makeProvider([clarificationToolCall("¿Cuántas horas trabajaste?")]);
    const result = await runLogWorkFeature({
      message: "Trabajé en #1234",
      model: "gpt-4o-mini",
      provider,
    });
    expect(result).toEqual({
      action: "needs_clarification",
      question: "¿Cuántas horas trabajaste?",
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
      toolCall("create_tasks_batch", { tasks: [{ pbiId: -1 }] }),
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

  it("resolves in two iterations when search_work_items returns results first", async () => {
    const searchResponse: ChatResponse = {
      raw: "",
      parsed: undefined,
      model: "gpt-4o-mini",
      latencyMs: 10,
      toolCalls: [{ id: "call_search", name: "search_work_items", arguments: { query: "login" } }],
      rawToolCalls: [
        { id: "call_search", type: "function", function: { name: "search_work_items", arguments: '{"query":"login"}' } },
      ],
    };
    const batchResponse = toolCall("create_tasks_batch", { tasks: [VALID_TASK] });

    const provider = makeProvider([searchResponse, batchResponse]);

    const result = await runLogWorkFeature({
      message: "Registra 2h en el bug de login",
      model: "gpt-4o-mini",
      provider,
    });

    expect(result.action).toBe("create_tasks_batch");
    expect(provider.chat).toHaveBeenCalledTimes(2);

    const secondCallMessages = provider.chat.mock.calls[1]![0].messages as Array<{ role: string }>;
    const roles = secondCallMessages.map((m) => m.role);
    expect(roles).toContain("assistant");
    expect(roles).toContain("tool");
  });

  it("resolves in two iterations when get_my_work_items is called first", async () => {
    const getItemsResponse: ChatResponse = {
      raw: "",
      parsed: undefined,
      model: "gpt-4o-mini",
      latencyMs: 10,
      toolCalls: [{ id: "call_mine", name: "get_my_work_items", arguments: {} }],
      rawToolCalls: [
        { id: "call_mine", type: "function", function: { name: "get_my_work_items", arguments: "{}" } },
      ],
    };
    const clarificationResponse = clarificationToolCall("¿En cuál de estos work items deseas registrar el tiempo?");

    const provider = makeProvider([getItemsResponse, clarificationResponse]);

    const result = await runLogWorkFeature({
      message: "Registra mis horas de hoy",
      model: "gpt-4o-mini",
      provider,
    });

    expect(result.action).toBe("needs_clarification");
    expect(provider.chat).toHaveBeenCalledTimes(2);
  });
});
