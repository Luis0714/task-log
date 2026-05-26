import type { PreviewResult } from "@/lib/schemas/agent";
import { previewResultSchema } from "@/lib/schemas/agent";

const SYSTEM_PROMPT = `Eres el intérprete de NeosView. El usuario describe trabajo en lenguaje natural.
Tu salida es SOLO un JSON válido, sin markdown ni texto adicional.

Acciones:
- "log_work": registrar horas en un elemento de trabajo de Azure DevOps. Requiere workItemId (número), hours (número positivo, máximo 24), comment (breve, en el idioma del usuario).
- "needs_clarification": si falta workItemId, horas o no queda claro el comentario del trabajo. Incluye "question" con UNA pregunta concreta.
- "unsupported": si la intención no es registrar tiempo de trabajo. Incluye "reason" breve.

Reglas:
- No inventes workItemId ni horas. Si el usuario no da ID explícito pero dice "US-123" o "#456", extrae el número.
- Si hay ambigüedad numérica (varios posibles IDs), usa needs_clarification.
- comment debe reflejar qué hizo el usuario; si no hay detalle, usa needs_clarification.`;

function parseHeuristic(text: string): PreviewResult | null {
  const t = text.trim();
  if (!t) return null;

  const idMatch =
    t.match(/\b(?:US|WI|AB|#|item|tarea|work\s*item)[\s:-]*(\d+)\b/i) ??
    t.match(/\b#(\d+)\b/) ??
    t.match(/\b(?:id|elemento)\s*(\d+)\b/i);
  const hoursMatch =
    t.match(/(\d+(?:[.,]\d+)?)\s*(?:h(?:oras?)?|hours?)\b/i) ??
    t.match(/\b(?:durante|por|de)\s*(\d+(?:[.,]\d+)?)\s*(?:h(?:oras?)?)?\b/i);

  if (!idMatch || !hoursMatch) return null;

  const workItemId = Number.parseInt(idMatch[1], 10);
  const hoursRaw = hoursMatch[1].replace(",", ".");
  const hours = Number.parseFloat(hoursRaw);
  if (!Number.isFinite(workItemId) || workItemId <= 0) return null;
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) return null;

  let comment = t
    .replace(idMatch[0], "")
    .replace(hoursMatch[0], "")
    .replace(/\s+/g, " ")
    .trim();
  if (comment.length < 2) comment = "Trabajo registrado";

  return {
    action: "log_work",
    workItemId,
    hours,
    comment: comment.slice(0, 2000),
  };
}

async function parseWithOpenAI(message: string): Promise<PreviewResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const safe = previewResultSchema.safeParse(parsed);
  return safe.success ? safe.data : null;
}

export async function interpretUserMessage(message: string): Promise<PreviewResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      action: "needs_clarification",
      question: "Escribe qué trabajo registraste, en qué elemento (ID) y cuántas horas.",
    };
  }

  try {
    const ai = await parseWithOpenAI(trimmed);
    if (ai) return ai;
  } catch {
    // cae al heurístico o clarificación
  }

  const heuristic = parseHeuristic(trimmed);
  if (heuristic) return heuristic;

  return {
    action: "needs_clarification",
    question:
      "No identifiqué un ID de elemento (por ejemplo US-123 o #456) y las horas. ¿Puedes repetirlo en una sola frase?",
  };
}
