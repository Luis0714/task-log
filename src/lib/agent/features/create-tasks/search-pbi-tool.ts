import { z } from "zod";

import { searchPbiByText, type PbiSearchHit } from "@/lib/azure-devops/search-pbi-by-text";
import type { ToolExecutionContext, ToolHandler } from "@/lib/agent/tools/types";
import type { NeedsClarificationPayload } from "@/lib/schemas/agent";

export const SEARCH_PBI_TOOL_NAME = "search_pbi";

const searchPbiArgsSchema = z.object({
  query: z.string().min(1).max(100),
});

export type SearchPbiContext = ToolExecutionContext & {
  sprintPath?: string;
};

export function buildSearchPbiTool(
  ctx: SearchPbiContext,
): ToolHandler<z.infer<typeof searchPbiArgsSchema>, NeedsClarificationPayload> {
  return {
    definition: {
      name: SEARCH_PBI_TOOL_NAME,
      strict: true,
      description:
        "Busca historias de usuario (Product Backlog Item) cuyo título contenga el texto dado. Úsala cuando el usuario menciona un número o fragmento del nombre y quieres confirmar a qué PBI se refiere antes de crear tasks.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            description: "Texto a buscar dentro del título de la PBI.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
    argsSchema: searchPbiArgsSchema,
    outputSchema: z.object({
      action: z.literal("needs_clarification"),
      question: z.string().min(1).max(500),
      candidates: z
        .array(
          z.object({
            id: z.number().int().positive(),
            title: z.string().min(1).max(500),
            state: z.string().min(1).max(100).optional(),
          }),
        )
        .max(8),
    }),
    handle: async (
      args,
      execCtx,
    ): Promise<NeedsClarificationPayload> => {
      const auth = execCtx.auth ?? ctx.auth;
      if (!auth) {
        return {
          action: "needs_clarification",
          question: "No hay conexión con Azure DevOps. Inicia sesión para continuar.",
          candidates: [],
        };
      }
      const hits: PbiSearchHit[] = await searchPbiByText(auth, args.query, ctx.sprintPath);
      if (hits.length === 0) {
        return {
          action: "needs_clarification",
          question: `No encontré ninguna PBI con "${args.query}" en el título. ¿Puedes verificar el ID o darme más detalle?`,
          candidates: [],
        };
      }
      if (hits.length === 1) {
        return {
          action: "needs_clarification",
          question: `Solo encontré esta PBI con "${args.query}". Si es correcta, responde con su ID #${hits[0]!.id}.`,
          candidates: hits.map((h) => ({ id: h.id, title: h.title, state: h.state })),
        };
      }
      const list = hits
        .map((h, i) => `${i + 1}. #${h.id} — ${h.title}`)
        .join("\n");
      return {
        action: "needs_clarification",
        question: `Encontré ${hits.length} PBIs que coinciden con "${args.query}":\n${list}\n¿Cuál quieres usar? Responde con el ID.`,
        candidates: hits.map((h) => ({ id: h.id, title: h.title, state: h.state })),
      };
    },
  };
}