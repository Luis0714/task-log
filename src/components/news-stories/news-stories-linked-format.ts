/**
 * Helpers puros del módulo "HUs vinculadas". Viven en un archivo aparte del
 * JSX para que se puedan testear sin renderizar y para mantener el resto de
 * componentes del módulo 100 % presentacionales.
 */

/** Subtítulo que resume cuántas HUs hay vinculadas al (proyecto, equipo). */
export function describeLinkedCount(count: number): string {
  if (count === 0) return "Ninguna HU vinculada todavía.";
  if (count === 1) return "1 HU vinculada.";
  return `${count} HUs vinculadas.`;
}
