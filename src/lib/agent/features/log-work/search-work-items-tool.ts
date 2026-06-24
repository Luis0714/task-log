import "server-only";

import { z } from "zod";

import { searchPbiByText } from "@/lib/azure-devops/search-pbi-by-text";
import { listWorkItemsForQuery } from "@/lib/azure-devops/list-work-items-for-query";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import type { ToolDefinition } from "@/lib/agent/provider/provider.types";

export const SEARCH_WORK_ITEMS_TOOL_NAME = "search_work_items";

export type SearchWorkItemsContext = {
  auth?: AdoCallerAuth;
  sprintPath?: string;
};

export type WorkItemCandidate = {
  id: number;
  title: string;
  state?: string;
  type: string;
};

export type SearchWorkItemsResult = {
  candidates: WorkItemCandidate[];
  count: number;
  hint?: string;
  error?: string;
};

const searchWorkItemsArgsSchema = z.object({
  query: z.string().min(1).max(200),
  types: z.array(z.enum(["pbi", "bug", "task"])).min(1).max(3).optional(),
});

export const SEARCH_WORK_ITEMS_TOOL_DEFINITION: ToolDefinition = {
  name: SEARCH_WORK_ITEMS_TOOL_NAME,
  description:
    "Busca work items (PBIs, bugs, tasks) cuyo título contenga el texto dado. Devuelve candidatos estructurados para que puedas decidir si registrar tiempo directamente o pedir confirmación al usuario. Úsala cuando el usuario no proporciona un ID numérico.",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        minLength: 1,
        maxLength: 200,
        description: "Texto a buscar en el título del work item.",
      },
      types: {
        type: "array",
        items: { type: "string", enum: ["pbi", "bug", "task"] },
        minItems: 1,
        maxItems: 3,
        description: "Tipos a incluir en la búsqueda. Omitir para buscar en todos.",
      },
    },
    required: ["query"],
    additionalProperties: false,
  },
};

export async function handleSearchWorkItems(
  args: z.infer<typeof searchWorkItemsArgsSchema>,
  ctx: SearchWorkItemsContext,
): Promise<SearchWorkItemsResult> {
  if (!ctx.auth) {
    return {
      candidates: [],
      count: 0,
      error: "No hay conexión con Azure DevOps. El usuario debe iniciar sesión.",
    };
  }

  const candidates: WorkItemCandidate[] = [];
  const seenIds = new Set<number>();

  const types = args.types ?? ["pbi", "bug", "task"];

  if (types.includes("pbi")) {
    const hits = await searchPbiByText(ctx.auth, args.query, ctx.sprintPath);
    for (const h of hits) {
      if (!seenIds.has(h.id)) {
        seenIds.add(h.id);
        candidates.push({ id: h.id, title: h.title, state: h.state, type: "pbi" });
      }
    }
  }

  if (types.includes("bug") || types.includes("task")) {
    const nonPbiTypes = types.filter((t): t is "bug" | "task" => t !== "pbi");
    if (nonPbiTypes.length > 0 && ctx.sprintPath) {
      const result = await listWorkItemsForQuery(
        { types: nonPbiTypes, sprintPath: ctx.sprintPath },
        ctx.auth,
      );
      if (result.ok) {
        const queryTokens = args.query
          .toLowerCase()
          .split(/\s+/)
          .filter((t) => t.length >= 2);
        for (const item of result.items) {
          if (!seenIds.has(item.id)) {
            const titleLower = item.title.toLowerCase();
            const matches = queryTokens.every((token) => titleLower.includes(token));
            if (matches) {
              seenIds.add(item.id);
              candidates.push({
                id: item.id,
                title: item.title,
                state: item.state,
                type: item.type,
              });
            }
          }
        }
      }
    }
  }

  if (candidates.length === 0) {
    return {
      candidates: [],
      count: 0,
      hint: `No encontré work items con "${args.query}". Usa needs_clarification para pedir el ID exacto al usuario.`,
    };
  }

  return { candidates: candidates.slice(0, 8), count: Math.min(candidates.length, 8) };
}

export { searchWorkItemsArgsSchema };
