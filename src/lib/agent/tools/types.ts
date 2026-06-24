import type { z } from "zod";

import type { ToolDefinition } from "@/lib/agent/provider/provider.types";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

/**
 * Contexto que el runner pasa al handler. Tools que no necesitan ADO (la mayoría)
 * lo ignoran. Tools que sí (ej. search_pbi, list_work_items) lo usan para hablar
 * con Azure DevOps.
 */
export type ToolExecutionContext = {
  auth?: AdoCallerAuth;
  sprintContext?: { sprintPath: string; team?: string };
};

/**
 * Cada tool del agente se define con:
 * - `definition`: JSON Schema que se envía al LLM (OpenAI / Anthropic lo necesita).
 * - `argsSchema`:  zod schema para validar los argumentos que llegan del LLM.
 * - `outputSchema`: zod schema para validar el resultado que produce el handler.
 * - `handle`: función que transforma args validados en output validado.
 */
export type ToolHandler<TArgs, TResult> = {
  definition: ToolDefinition;
  argsSchema: z.ZodType<TArgs>;
  outputSchema: z.ZodType<TResult>;
  handle: (
    args: TArgs,
    ctx: ToolExecutionContext,
  ) => TResult | Promise<TResult>;
};