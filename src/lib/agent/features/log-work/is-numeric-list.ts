/**
 * Predicado puro: ¿el input es una lista de índices numéricos separados
 * por coma o espacio?
 *
 * Detecta patrones del estilo "1, 2, 3" o "1 2 3" que el usuario tipea
 * como confirmación posicional en selecciones multi-select. Se valida
 * token por token para evitar regex con cuantificadores anidados, que
 * son vulnerables a backtracking exponencial (Sonar S5852 ReDoS).
 */

const SEPARATORS = new Set([" ", "\t", "\n", "\r", ","]);

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let buf = "";
  for (const ch of input) {
    if (SEPARATORS.has(ch)) {
      if (buf.length > 0) {
        tokens.push(buf);
        buf = "";
      }
    } else {
      buf += ch;
    }
  }
  if (buf.length > 0) tokens.push(buf);
  return tokens;
}

function isDigitsOnly(token: string): boolean {
  if (token.length === 0) return false;
  for (const ch of token) {
    const code = ch.codePointAt(0);
    if (code === undefined || code < 48 || code > 57) return false;
  }
  return true;
}

export function isNumericList(input: string): boolean {
  const tokens = tokenize(input);
  if (tokens.length < 2) return false;
  return tokens.every(isDigitsOnly);
}
