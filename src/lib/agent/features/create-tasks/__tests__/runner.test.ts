import { beforeEach, describe, expect, it, vi } from "vitest";

import "@/lib/agent/features/create-tasks";

import type { AgentProvider, ChatRequest, ChatResponse } from "@/lib/agent/provider/provider.types";
import {
  runCreateTasksFeature,
  type SprintContext,
} from "@/lib/agent/features/create-tasks/runner";

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

const SPRINT_CONTEXT: SprintContext = {
  project: "Plataforma Virtual",
  team: "Studia LMS",
  sprintPath: "Plataforma Virtual/Sprint 12",
  sprintStartDate: "2026-06-15",
  sprintFinishDate: "2026-06-26",
  nonWorkingDates: ["2026-06-20"],
};

describe("runCreateTasksFeature", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a single task from the create_tasks_batch tool call", async () => {
    const provider = makeProvider([
      toolCall("create_tasks_batch", {
        pbiId: 123,
        pbiTitle: "Login fixes",
        tasks: [
          {
            title: "Bug del login",
            hours: 2,
            description: "Corrección del login",
            activity: "Development",
            workingDate: "2026-06-16",
            workingTime: "09:00",
            state: "Closed",
            markAsDone: true,
            sprintPath: "Plataforma Virtual/Sprint 12",
            team: "Studia LMS",
          },
        ],
      }),
    ]);
    const result = await runCreateTasksFeature({
      message: "El martes 2h en el bug del login bajo PBI 123",
      model: "gpt-4o-mini",
      provider,
      sprintContext: SPRINT_CONTEXT,
    });
    expect(result.action).toBe("create_tasks_batch");
    if (result.action !== "create_tasks_batch") return;
    expect(result.tasks).toHaveLength(1);
    expect(result.pbiId).toBe(123);
    expect(result.pbiTitle).toBe("Login fixes");
  });

  it("returns needs_clarification when the LLM invokes needs_clarification", async () => {
    const provider = makeProvider([
      toolCall("needs_clarification", { question: "¿Bajo qué PBI padre?" }),
    ]);
    const result = await runCreateTasksFeature({
      message: "Hoy hice unas cosas",
      model: "gpt-4o-mini",
      provider,
      sprintContext: SPRINT_CONTEXT,
    });
    expect(result).toEqual({
      action: "needs_clarification",
      question: "¿Bajo qué PBI padre?",
    });
  });

  it("returns unsupported when the LLM invokes unsupported", async () => {
    const provider = makeProvider([
      toolCall("unsupported", {
        reason: "El mensaje describe horas sobre work items existentes, no creación de tasks.",
      }),
    ]);
    const result = await runCreateTasksFeature({
      message: "Hoy trabajé en #1234 1h revisando PR",
      model: "gpt-4o-mini",
      provider,
      sprintContext: SPRINT_CONTEXT,
    });
    expect(result).toEqual({
      action: "unsupported",
      reason: "El mensaje describe horas sobre work items existentes, no creación de tasks.",
    });
  });

  it("passes sprint context (dates + non-working) in the system prompt", async () => {
    const provider = makeProvider([
      toolCall("create_tasks_batch", {
        pbiId: 1,
        pbiTitle: "X",
        tasks: [
          {
            title: "t",
            hours: 1,
            description: "d",
            activity: "Development",
            workingDate: "2026-06-16",
            workingTime: "09:00",
            state: "Closed",
            markAsDone: true,
            sprintPath: SPRINT_CONTEXT.sprintPath,
            team: SPRINT_CONTEXT.team,
          },
        ],
      }),
    ]);
    await runCreateTasksFeature({
      message: "X",
      model: "gpt-4o-mini",
      provider,
      sprintContext: SPRINT_CONTEXT,
    });
    const call = provider.chat.mock.calls[0]![0];
    expect(call.systemPrompt).toContain("2026-06-15");
    expect(call.systemPrompt).toContain("2026-06-26");
    expect(call.systemPrompt).toContain("2026-06-20");
  });

  it("throws when the provider returns no tool calls", async () => {
    const provider = makeProvider([
      { raw: "", parsed: undefined, model: "gpt-4o-mini", latencyMs: 5 },
    ]);
    await expect(
      runCreateTasksFeature({
        message: "Algo",
        model: "gpt-4o-mini",
        provider,
        sprintContext: SPRINT_CONTEXT,
      }),
    ).rejects.toThrow(/no invocó ninguna herramienta/);
  });

  it("throws when the tool arguments are invalid", async () => {
    const provider = makeProvider([
      toolCall("create_tasks_batch", {
        pbiId: 1,
        pbiTitle: "X",
        tasks: [{ title: "t", hours: 999, description: "d" }],
      }),
    ]);
    await expect(
      runCreateTasksFeature({
        message: "Algo",
        model: "gpt-4o-mini",
        provider,
        sprintContext: SPRINT_CONTEXT,
      }),
    ).rejects.toThrow(/Argumentos inválidos/);
  });

  it("returns needs_clarification for empty messages without calling the provider", async () => {
    const provider = makeProvider([]);
    const result = await runCreateTasksFeature({
      message: "   ",
      model: "gpt-4o-mini",
      provider,
      sprintContext: SPRINT_CONTEXT,
    });
    expect(result.action).toBe("needs_clarification");
    expect(provider.chat).not.toHaveBeenCalled();
  });
});