/**
 * Resolution de selecciones del usuario a partir del input libre.
 *
 * Contexto: el UI envía la respuesta del usuario como string (sea el
 * value de un checkbox que clickeó, o texto libre que tipeó). El LLM
 * debería poder interpretar ese string sin ambigüedad, pero en la
 * práctica se confunde cuando el input es una lista de IDs separados
 * por coma (ej. "258439,257633") — a veces los busca de nuevo en
 * ADO en vez de matchearlos contra los candidatos que ya tiene en
 * contexto.
 *
 * Esta utility resuelve ese caso: si el input del usuario parece una
 * lista de IDs, intenta matchear cada uno contra los `value`s o `id`s
 * de las opciones que el LLM mostró. Devuelve un payload estructurado
 * que el runner puede inyectar como mensaje al LLM en lugar del raw
 * input — el LLM recibe "User selected: [HU 123 - title, ...]" en
 * vez de "258439,257633" y no tiene que parsear.
 */

import { isNumericList } from "@/lib/agent/features/log-work/is-numeric-list";

export type SelectionOption = {
  id: string;
  label: string;
  value?: string;
};

export type PendingSelectionQuestion = {
  toolName: string;
  question: string;
  options: ReadonlyArray<SelectionOption>;
  multiSelect: boolean;
};

export type MatchedOption = {
  option: SelectionOption;
  raw: string;
};

export type ResolvedSelection = {
  /** Input normalizado que NO se pudo matchear contra ninguna opción. */
  unmatched: string[];
  /** Opciones que el runner ya resolvió como seleccionadas. */
  matched: MatchedOption[];
};

/**
 * Intenta resolver el input del usuario contra las opciones de la
 * pregunta pendiente. Devuelve un payload con `matched` (opciones
 * identificadas) y `unmatched` (tokens que no correspondieron a nada).
 *
 * - Si `pending` es null, devuelve `{ matched: [], unmatched: [raw] }`
 *   para que el caller sepa que no había pregunta activa.
 * - Si el input está vacío, devuelve listas vacías.
 * - Si la pregunta es multiSelect, separa el input por coma y trata
 *   cada token como una selección individual.
 * - Si es singleSelect, trata el input entero como una selección.
 *
 * El matching es tolerante: matchea por `value` exacto primero, luego
 * por `id` exacto, luego por substring case-insensitive del `label`.
 */
export function resolveSelection(
  rawInput: string,
  pending: PendingSelectionQuestion | null,
): ResolvedSelection {
  const input = rawInput.trim();
  if (!input || !pending) {
    return { matched: [], unmatched: input ? [input] : [] };
  }

  // **Confirmaciones naturales**: si el usuario dice "las dos",
  // "ambas", "todas", "sí", "ok", "yes" → matchea TODAS las opciones
  // que el LLM mostró. Esto evita que el runner devuelva raw input
  // y que el LLM interprete la confirmación como un nuevo pedido.
  if (isBulkConfirmation(input)) {
    return {
      matched: pending.options.map((opt) => ({
        option: opt,
        raw: input,
      })),
      unmatched: [],
    };
  }

  // **Siempre** partimos por coma. Si el LLM preguntó single-select
  // pero el usuario tipeó varios IDs separados por coma, eso es señal
  // de que quiere varios — el runner no debe forzar al usuario a
  // una sola selección cuando su input claramente indica varias.
  const tokens = input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const matched: MatchedOption[] = [];
  const unmatched: string[] = [];

  for (const token of tokens) {
    const hit = matchToken(token, pending.options);
    if (hit) {
      matched.push({ option: hit, raw: token });
    } else {
      unmatched.push(token);
    }
  }

  return { matched, unmatched };
}

/**
 * Detecta confirmaciones masivas en lenguaje natural. Si el usuario
 * escribió algo así después de que el LLM mostró opciones, asumimos
 * que está confirmando TODAS las opciones mostradas. Esto evita
 * que el runner devuelva el raw input y que el LLM lo interprete
 * como un nuevo pedido (típicamente, una re-búsqueda en ADO).
 *
 * Las patterns son SUBSTRING (no exact match) para tolerar frases
 * completas: "las dos son correctas" contiene "las dos", "ok bien"
 * contiene "ok", etc. Por eso usamos `.includes()` en vez de regex
 * con `^`/`$`.
 *
 * Excluimos palabras ambiguas sueltas como "completo" o
 * "completos" — pueden significar afirmación genérica en vez de
 * selección completa de items. Solo patrones claramente de
 * confirmación.
 */
const BULK_CONFIRMATION_SUBSTRINGS = [
  // Cuantificadores: "las dos", "las tres", "los dos", "ambos", "ambas"
  "las dos",
  "las tres",
  "las cuatro",
  "las cinco",
  "los dos",
  "los tres",
  "ambos ",
  "ambas ",
  "ambas opciones",
  "ambos items",
  "todos los items",
  "todas las opciones",
  // Afirmaciones simples — exact match después de trim/lower
  // (manejadas abajo en `isExactAffirmation`)
];

const EXACT_AFFIRMATIONS = new Set([
  "todas",
  "todo",
  "todos",
  "si",
  "sí",
  "yes",
  "ok",
  "okay",
  "dale",
  "listo",
  "listos",
  "confirma",
  "confirmo",
  "acepta",
  "aceptar",
  "correcto",
  "correcta",
  "correctos",
  "correctas",
  "va",
  "perfecto",
  "genial",
  "hecho",
]);

function isBulkConfirmation(input: string): boolean {
  const normalized = input.trim().toLowerCase();
  if (BULK_CONFIRMATION_SUBSTRINGS.some((sub) => normalized.includes(sub))) {
    return true;
  }
  if (EXACT_AFFIRMATIONS.has(normalized)) {
    return true;
  }
  return isNumericList(normalized);
}

function matchToken(
  token: string,
  options: ReadonlyArray<SelectionOption>,
): SelectionOption | null {
  const lower = token.toLowerCase();
  // 1) Match exacto por value
  for (const opt of options) {
    if (opt.value && opt.value === token) return opt;
  }
  // 2) Match exacto por id
  for (const opt of options) {
    if (opt.id === token) return opt;
  }
  // 3) Substring case-insensitive del label (útil para "Autenticación")
  for (const opt of options) {
    if (lower.length >= 3 && opt.label.toLowerCase().includes(lower)) {
      return opt;
    }
  }
  // 4) El label contiene el token
  for (const opt of options) {
    if (opt.label.toLowerCase().includes(lower) && lower.length >= 3) {
      return opt;
    }
  }
  return null;
}

/**
 * Construye un mensaje estructurado para inyectar en la conversación
 * del LLM cuando el usuario ya respondió a una `question_with_options`
 * y el runner resolvió la selección.
 *
 * El mensaje es tipo `user` (lo que el usuario "dijo") pero con un
 * formato explícito que el LLM no puede malinterpretar:
 *
 *   "Seleccionaste: HU 258439: Autenticación (id 258439), HU 257633: ..."
 *
 * Si hay tokens unmatched, también los incluye (caso raro: el usuario
 * tipeó un ID que no está en las opciones, ej. lo escribió a mano).
 */
export function buildSelectionMessage(
  userInput: string,
  pending: PendingSelectionQuestion,
  resolved: ResolvedSelection,
): string {
  // Si nada matcheó, devolvemos el input crudo o vacío — el LLM lo
  // procesa como texto libre (no había una pregunta estructurada
  // que resolver).
  if (resolved.matched.length === 0) {
    if (resolved.unmatched.length === 0) {
      return "(El usuario no respondió.)";
    }
    return userInput;
  }

  // Hablamos en PRIMERA persona (voz del usuario) y le indicamos
  // EXPLÍCITAMENTE al LLM qué hacer a continuación. Esto evita que
  // el LLM re-llame question_with_options con las mismas opciones
  // interpretando el mensaje como una "presentación de opciones".
  // Referenciamos la pregunta anterior explícitamente para que el
  // LLM entienda que este mensaje ES LA RESPUESTA del usuario
  // a esa pregunta (no un nuevo pedido).
  const lines: string[] = [
    `Respondiendo a tu pregunta "${pending.question}":`,
    `Elegí estos ${resolved.matched.length} work items:`,
    ...resolved.matched.map(
      (m) => `- ${m.option.label} (id numérico: ${m.option.value ?? m.option.id})`,
    ),
  ];

  if (resolved.matched.length === 1) {
    lines.push(
      "Mi siguiente respuesta será cuántas horas trabajé. NO me preguntes de nuevo por los work items.",
    );
  } else {
    lines.push(
      "Mi siguiente respuesta será si las horas son iguales para todos o diferentes por item. NO me preguntes de nuevo por los work items.",
    );
  }

  if (resolved.unmatched.length > 0) {
    lines.push(
      `Nota: estos tokens que escribí no matchearon con ninguna opción: ${resolved.unmatched.join(", ")}. Ignóralos.`,
    );
  }

  return lines.join("\n");
}

/**
 * Extrae la última `question_with_options` o `needs_clarification`
 * de la lista de mensajes del assistant. Sirve para detectar, al
 * inicio de un nuevo turno del usuario, si la pregunta anterior fue
 * interactiva (candidato a resolución) o no.
 *
 * Devuelve `null` si la última acción del assistant fue una tool
 * terminal (create_tasks_batch, list_work_items CON summary, etc.) —
 * en ese caso el siguiente mensaje del usuario es un turno nuevo,
 * no una respuesta a opciones.
 */
export function extractLastInteractiveQuestion(
  messages: ReadonlyArray<{ role?: string; content?: unknown; tool_calls?: unknown }>,
): PendingSelectionQuestion | null {
  // Buscar de atrás hacia adelante el último assistant con tool_calls
  // interactivas. Cada paso se delega a un helper para mantener la
  // función principal plana.
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg?.role !== "assistant") continue;
    return findInteractiveInToolCalls(msg.tool_calls);
  }
  return null;
}

function findInteractiveInToolCalls(
  toolCalls: unknown,
): PendingSelectionQuestion | null {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
    return null;
  }
  for (const rawCall of toolCalls) {
    const parsed = parseInteractiveCall(rawCall);
    if (parsed) return parsed;
  }
  return null;
}

function parseInteractiveCall(
  rawCall: unknown,
): PendingSelectionQuestion | null {
  if (!isObject(rawCall)) return null;
  const fn = (rawCall as { function?: { name?: unknown } }).function;
  const name = typeof fn?.name === "string" ? fn.name : null;
  if (name === "question_with_options") {
    return parseQuestionWithOptionsCall(rawCall);
  }
  if (name === "needs_clarification") {
    return parseNeedsClarificationCall(rawCall);
  }
  return null;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseQuestionWithOptionsCall(
  rawCall: unknown,
): PendingSelectionQuestion | null {
  if (!isObject(rawCall)) return null;
  const fn = (rawCall as { function?: { arguments?: unknown } }).function;
  const args = parseJsonArgs(fn?.arguments);
  if (!isObject(args)) return null;

  const options = Array.isArray(args.options) ? args.options : [];
  return {
    toolName: "question_with_options",
    question: typeof args.question === "string" ? args.question : "",
    multiSelect: args.multiSelect === true,
    options: options.flatMap((opt): SelectionOption[] => {
      if (!isObject(opt)) return [];
      if (typeof opt.id !== "string" || typeof opt.label !== "string") {
        return [];
      }
      return [
        {
          id: opt.id,
          label: opt.label,
          ...(typeof opt.value === "string" ? { value: opt.value } : {}),
        },
      ];
    }),
  };
}

function parseNeedsClarificationCall(
  rawCall: unknown,
): PendingSelectionQuestion | null {
  if (!isObject(rawCall)) return null;
  const fn = (rawCall as { function?: { arguments?: unknown } }).function;
  const args = parseJsonArgs(fn?.arguments);
  if (!isObject(args)) return null;
  // needs_clarification no tiene opciones, solo texto libre — no
  // podemos resolver selecciones aquí. Devolvemos un placeholder
  // para que el runner sepa que la última pregunta fue abierta.
  return {
    toolName: "needs_clarification",
    question: typeof args.question === "string" ? args.question : "",
    multiSelect: false,
    options: [],
  };
}

function parseJsonArgs(raw: unknown): Record<string, unknown> | null {
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Convierte un preview del UI (formato `PreviewResult`) en un tool
 * call sintético que `extractLastInteractiveQuestion` puede parsear.
 * Se usa en el cliente (use-copilot) para reconstruir los tool calls
 * originales que el LLM emitió antes de que el preview fuera
 * formateado por el runner.
 */
export function previewToSyntheticToolCall(
  preview: unknown,
): Record<string, unknown> | null {
  if (!isObject(preview)) return null;
  const action = (preview as { action?: unknown }).action;

  if (action === "question_with_options") {
    const p = preview as {
      question?: unknown;
      options?: unknown;
      multiSelect?: unknown;
    };
    if (
      typeof p.question !== "string" ||
      !Array.isArray(p.options)
    ) {
      return null;
    }
    return {
      function: {
        name: "question_with_options",
        arguments: JSON.stringify({
          question: p.question,
          options: p.options,
          multiSelect: p.multiSelect === true,
        }),
      },
    };
  }

  if (action === "needs_clarification") {
    const p = preview as { question?: unknown };
    if (typeof p.question !== "string") return null;
    return {
      function: {
        name: "needs_clarification",
        arguments: JSON.stringify({ question: p.question }),
      },
    };
  }

  return null;
}
