import "server-only";

import { z } from "zod";

import { listWorkItemsForQuery } from "@/lib/azure-devops/list-work-items-for-query";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import type { ToolDefinition } from "@/lib/agent/provider/provider.types";

export const GET_MY_WORK_ITEMS_TOOL_NAME = "get_my_work_items";

export type GetMyWorkItemsContext = {
  auth?: AdoCallerAuth;
  sprintPath?: string;
};

export type MyWorkItem = {
  id: number;
  title: string;
  state?: string;
  type: string;
};

export type GetMyWorkItemsResult = {
  items: MyWorkItem[];
  count: number;
  error?: string;
};

const getMyWorkItemsArgsSchema = z.object({
  types: z.array(z.enum(["pbi", "bug", "task"])).min(1).max(3).optional(),
  limit: z.number().int().min(1).max(20).optional(),
});

export const GET_MY_WORK_ITEMS_TOOL_DEFINITION: ToolDefinition = {
  name: GET_MY_WORK_ITEMS_TOOL_NAME,
  strict: true,
  description:
    "Lista los work items asignados al usuario actual en el sprint activo. Úsala cuando el usuario no menciona un work item específico y necesitas saber en qué está trabajando actualmente para sugerir dónde registrar el tiempo.",
  parameters: {
    type: "object",
    properties: {
      types: {
        type: "array",
        items: { type: "string", enum: ["pbi", "bug", "task"] },
        minItems: 1,
        maxItems: 3,
        description: "Tipos de work item a incluir. Omitir para todos.",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 20,
        description: "Número máximo de items a devolver. Por defecto 10.",
      },
    },
    additionalProperties: false,
  },
};

export async function handleGetMyWorkItems(
  args: z.infer<typeof getMyWorkItemsArgsSchema>,
  ctx: GetMyWorkItemsContext,
): Promise<GetMyWorkItemsResult> {
  if (!ctx.auth) {
    return {
      items: [],
      count: 0,
      error: "No hay conexión con Azure DevOps. El usuario debe iniciar sesión.",
    };
  }

  if (!ctx.sprintPath) {
    return {
      items: [],
      count: 0,
      error: "No hay un sprint activo. No se pueden listar work items por sprint.",
    };
  }

  const result = await listWorkItemsForQuery(
    {
      types: args.types ?? ["pbi", "bug", "task"],
      assignedToMe: true,
      sprintPath: ctx.sprintPath,
      limit: args.limit ?? 10,
    },
    ctx.auth,
  );

  if (!result.ok) {
    return { items: [], count: 0, error: result.userMessage };
  }

  const items: MyWorkItem[] = result.items.map((item) => ({
    id: item.id,
    title: item.title,
    state: item.state,
    type: item.type,
  }));

  return { items, count: items.length };
}

export { getMyWorkItemsArgsSchema };
