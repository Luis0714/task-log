/**
 * Predicado puro: ¿el input es una lista de índices numéricos separados
 * por coma o espacio?
 *
 * Detecta patrones del estilo "1, 2, 3" o "1 2 3" que el usuario tipea
 * como confirmación posicional en selecciones multi-select. Se valida
 * token por token para evitar regex con cuantificadores anidados, que
 * son vulnerables a backtracking exponencial (Sonar S5852 ReDoS).
 */
export function isNumericList(input: string): boolean {
  const tokens = input
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (tokens.length < 2) return false;
  return tokens.every((t) => /^\d+$/.test(t));
}
