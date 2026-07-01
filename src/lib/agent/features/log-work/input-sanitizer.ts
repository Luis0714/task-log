/**
 * Normaliza el mensaje crudo del usuario antes de enviarlo al LLM.
 * El objetivo es robustez: si el usuario pega basura, hace spam, o tipea
 * un mensaje degenerado, NO debe romper el bucle ReAct ni hacer que el
 * LLM se confunda.
 *
 * Reglas (en orden):
 * 1. Trim de whitespace.
 * 2. Strip de caracteres de control (NUL, BEL, escapes ANSI, etc.) que
 *    no aportan significado y pueden confundir al LLM.
 * 3. Detección de "spam de repetición" (ej. "hhhhhhh", "aaaaa",
 *    "registrar mis horashhhhh..."). Si un mismo caracter se repite
 *    más de MAX_REPEAT veces consecutivas, se colapsa a MAX_REPEAT.
 *    Esto preserva la intención sin intoxicar al LLM con basura.
 * 4. Cap de longitud: cualquier mensaje más largo que MAX_LENGTH se
 *    trunca con un sufijo "…" para no saturar la ventana de contexto.
 *
 * Si después de todo esto el mensaje queda vacío, devuelve string vacío
 * — el caller lo maneja con needs_clarification pidiendo que reescriba.
 */
const MAX_REPEAT = 8;
const MAX_LENGTH = 2000;

// Regex construida con `new RegExp` y `String.raw` para poder usar
// la constante MAX_REPEAT sin escapar manualmente los backslashes.
// Los regex literals no interpolan variables, y un template literal
// normal con `\1` lo trataría como un escape octal inválido.
const REPEATED_CHAR_PATTERN = new RegExp(String.raw`(.)\1{${MAX_REPEAT},}`, "gu");

export function sanitizeUserInput(input: string): string {
  // 1) Trim básico
  let s = input.trim();

  // 2) Strip control chars (except newline y tab que sí tienen sentido)
  // eslint-disable-next-line no-control-regex
  s = s.replace(/[\x00-\x08\x0B-\x1F\x7F]/g, "");

  // 3) Colapsar repeticiones largas
  s = s.replace(REPEATED_CHAR_PATTERN, (_match, ch) => ch.repeat(MAX_REPEAT));

  // 4) Cap de longitud
  if (s.length > MAX_LENGTH) {
    s = `${s.slice(0, MAX_LENGTH)}…`;
  }

  return s;
}
