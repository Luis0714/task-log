/** True cuando ADO está listo y alguna fuente de datos de la sección sigue cargando. */
export function isSectionLoading(
  adoExecutionReady: boolean,
  ...sources: boolean[]
): boolean {
  return adoExecutionReady && sources.some(Boolean);
}
