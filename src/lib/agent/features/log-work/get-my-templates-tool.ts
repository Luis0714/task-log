import "server-only";

import { z } from "zod";

import type { ToolDefinition } from "@/lib/agent/provider/provider.types";
import { getRoleNameForUser, getTemplatesForUser } from "@/lib/time-log/templates";
import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";

export const GET_MY_TEMPLATES_TOOL_NAME = "get_my_templates";

export type GetMyTemplatesContext = {
  userId?: string;
  userRole?: string | null;
};

export type GetMyTemplatesResult = {
  templates: Array<{
    id: string;
    name: string;
    defaultTitle: string;
    defaultDescription: string;
    defaultActivity: string | null;
    defaultHours: number | null;
    scope: "personal" | "global";
    authorName: string | null;
  }>;
  count: number;
  error?: string;
};

const getMyTemplatesArgsSchema = z.object({
  /**
   * Filtra las plantillas cuyo `name` o `defaultTitle` contenga este texto
   * (case-insensitive). Útil cuando el usuario describe un tipo de trabajo
   * recurrente (p.ej. "daily", "revisión de PRs") y queremos ver si ya tiene
   * una plantilla guardada. Si se omite, devuelve todas.
   */
  query: z.string().trim().min(1).max(120).optional(),
  /** Tope máximo de plantillas a devolver. Por defecto 20. */
  limit: z.number().int().min(1).max(50).optional(),
});

export const GET_MY_TEMPLATES_TOOL_DEFINITION: ToolDefinition = {
  name: GET_MY_TEMPLATES_TOOL_NAME,
  description:
    "Devuelve las PLANTILLAS de time-log visibles para el usuario actual: primero sus plantillas personales y luego las del sistema (globales / por rol). " +
    "Una plantilla es un bloque reutilizable con título, descripción, actividad y horas por defecto que el usuario (o un admin) ha guardado para no reescribir cada vez el mismo trabajo recurrente (ej. 'Daily', 'Code review', 'Reunión semanal'). " +
    "ÚSALA cuando el usuario describe un trabajo que parece recurrente o genérico: revisa si ya existe una plantilla coincidente y, si la hay, utilízala como EJEMPLO/INSPIRACIÓN para autollenar title, description, activity y hours de las tasks que vas a proponer ANTES de que el usuario las confirme. " +
    "NO insertes el contenido de la plantilla en la respuesta al usuario — solo úsala como referencia interna para mejorar la propuesta. " +
    "Si no hay plantilla coincidente, sigue el flujo normal (investiga work items, propone tasks desde cero).",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        minLength: 1,
        maxLength: 120,
        description:
          "Texto a buscar dentro del nombre o título por defecto de la plantilla. Omitir para devolver todas.",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 50,
        description: "Máximo de plantillas a devolver. Por defecto 20.",
      },
    },
    additionalProperties: false,
  },
};

export async function handleGetMyTemplates(
  args: z.infer<typeof getMyTemplatesArgsSchema>,
  ctx: GetMyTemplatesContext,
): Promise<GetMyTemplatesResult> {
  if (!ctx.userId) {
    return {
      templates: [],
      count: 0,
      error:
        "No hay sesión de usuario activa. Las plantillas son privadas por usuario.",
    };
  }

  let allTemplates: TimeLogTemplateDto[];
  try {
    const roleName = await getRoleNameForUser(ctx.userId);
    allTemplates = await getTemplatesForUser(ctx.userId, roleName);
  } catch (err) {
    return {
      templates: [],
      count: 0,
      error:
        err instanceof Error
          ? `No pudimos cargar las plantillas: ${err.message}`
          : "No pudimos cargar las plantillas.",
    };
  }

  const filtered = args.query
    ? allTemplates.filter((t) => matchesQuery(t, args.query!))
    : allTemplates;
  const limited = filtered.slice(0, args.limit ?? 20);

  return {
    templates: limited.map(toTemplateSummary),
    count: limited.length,
  };
}

function toTemplateSummary(t: TimeLogTemplateDto): GetMyTemplatesResult["templates"][number] {
  const scope: "personal" | "global" =
    t.isSystem && t.seedKey === "global" ? "global" : "personal";
  return {
    id: t.id,
    name: t.name,
    defaultTitle: t.defaultTitle,
    defaultDescription: t.defaultDescription,
    defaultActivity: t.defaultActivity,
    defaultHours: t.defaultHours,
    scope,
    authorName: t.authorName,
  };
}

function matchesQuery(
  template: TimeLogTemplateDto,
  query: string,
): boolean {
  const needle = query.toLowerCase();
  return (
    template.name.toLowerCase().includes(needle) ||
    template.defaultTitle.toLowerCase().includes(needle)
  );
}

export { getMyTemplatesArgsSchema };