import "server-only";

import { findToolHandler } from "@/lib/agent/tools/registry";
import { buildSearchPbiTool } from "@/lib/agent/features/create-tasks/search-pbi-tool";
import type { ToolExecutionContext, ToolHandler } from "@/lib/agent/tools/types";
import type { AgentProvider } from "@/lib/agent/provider/provider.types";
import { previewResultSchema } from "@/lib/schemas/agent";
import type { PreviewResult } from "@/lib/schemas/agent";

import { createTasksBatchTool } from "./tool";
import { buildCreateTasksSystemPrompt } from "./prompt";

export type SprintContext = {
  project: string;
  team: string;
  sprintPath: string;
  sprintStartDate: string;
  sprintFinishDate: string;
  nonWorkingDates: readonly string[];
};

export type RunCreateTasksArgs = {
  message: string;
  model: string;
  provider: AgentProvider;
  sprintContext: SprintContext;
  executionContext?: ToolExecutionContext;
};

type SearchPbiTool = ReturnType<typeof buildSearchPbiTool>;
type CreateTasksRunnerTool = ToolHandler<unknown, PreviewResult>;

export async function runCreateTasksFeature({
  message,
  model,
  provider,
  sprintContext,
  executionContext,
}: RunCreateTasksArgs): Promise<PreviewResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      action: "needs_clarification",
      question:
        "Cuéntame qué trabajo hiciste, en qué días, cuántas horas y bajo qué PBI padre quieres crear las tasks.",
    };
  }

  const systemPrompt = buildCreateTasksSystemPrompt(sprintContext);
  const searchPbiTool = buildSearchPbiTool({
  ...(executionContext ?? {}),
  sprintPath: sprintContext.sprintPath,
});

  const response = await provider.chat({
    model,
    temperature: 0.1,
    systemPrompt,
    userMessage: trimmed,
    tools: [createTasksBatchTool.definition, searchPbiTool.definition],
  });

  const preview = resolvePreviewFromToolCall(
    response.toolCalls,
    executionContext,
    searchPbiTool,
  );
  const safe = previewResultSchema.safeParse(preview);
  if (safe.success) return safe.data;

  throw new Error("La IA devolvió una herramienta con argumentos inválidos.");
}

function resolvePreviewFromToolCall(
  toolCalls: ReadonlyArray<{ id: string; name: string; arguments: unknown }> | undefined,
  ctx: ToolExecutionContext | undefined,
  searchPbiTool: SearchPbiTool,
): PreviewResult {
  if (!toolCalls || toolCalls.length === 0) {
    throw new Error("La IA no invocó ninguna herramienta.");
  }

  // El LLM puede encadenar llamadas (search_pbi → create_tasks_batch).
  // Devolvemos el resultado de la ÚLTIMA llamada — es el que define la UI.
  let lastPreview: PreviewResult | null = null;

  for (const call of toolCalls) {
    const handler = resolveHandler(call.name, searchPbiTool);
    if (!handler) {
      throw new Error(`Herramienta desconocida: ${call.name}`);
    }
    const parsedArgs = handler.argsSchema.safeParse(call.arguments);
    if (!parsedArgs.success) {
      throw new Error(`Argumentos inválidos para ${call.name}.`);
    }
    const output = handler.handle(parsedArgs.data, ctx ?? {});
    lastPreview = handler.outputSchema.parse(output);
  }

  if (!lastPreview) {
    throw new Error("La IA no devolvió un preview procesable.");
  }
  return lastPreview;
}

function resolveHandler(
  name: string,
  searchPbiTool: SearchPbiTool,
): CreateTasksRunnerTool | null {
  const registered = findToolHandler(name);
  if (registered) return registered as CreateTasksRunnerTool;
  if (name === searchPbiTool.definition.name) {
    return searchPbiTool as CreateTasksRunnerTool;
  }
  return null;
}