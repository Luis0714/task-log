/**
 * Extrae los archivos de imagen de un `DataTransfer` (pegar, soltar o copiar
 * archivos). Devuelve cada imagen UNA sola vez, aunque aparezca tanto en
 * `source.files` como en `source.items[i].getAsFile()`: en los navegadores
 * modernos el mismo `File` se expone por las dos vías al pegar una captura,
 * por lo que recorrer ambas sin deduplicar insertaba cada imagen dos veces.
 *
 * Reglas de dedup (en orden):
 *  1. Identidad de referencia: si `source.files[i] === source.items[j].getAsFile()`
 *     (lo habitual en Chrome/Firefox/Safari), descartamos el duplicado.
 *  2. Huella de contenido basada en `size` y `type`: cubre el caso real que
 *     vimos en producción — algunos navegadores (especialmente al pegar
 *     capturas) exponen objetos `File` DISTINTOS por `.files` y
 *     `.items[i].getAsFile()`, con `name` y `lastModified` también
 *     diferentes entre sí (p. ej. `""` vs `"image.png"`, `0` vs el
 *     timestamp de pegado). La misma imagen comparte SIEMPRE tamaño y
 *     MIME, así que esa es la clave mínima robusta. La probabilidad de
 *     colisión entre dos imágenes distintas con el mismo `size|type` es
 *     despreciable en una sola acción de pegado.
 *  3. Sólo se aceptan archivos con `type` que arranque por `image/`.
 */
export function extractImageFiles(
  source: DataTransfer | null | undefined,
): File[] {
  if (!source) return [];

  const files: File[] = [];
  const seenByRef = new Set<File>();
  const seenByContent = new Set<string>();

  const pushIfNew = (candidate: File | null | undefined): void => {
    if (!candidate) return;
    if (!candidate.type.startsWith("image/")) return;
    if (seenByRef.has(candidate)) return;

    const contentKey = `${candidate.size}|${candidate.type}`;
    if (seenByContent.has(contentKey)) return;

    seenByRef.add(candidate);
    seenByContent.add(contentKey);
    files.push(candidate);
  };

  // 1) Items primero: cubre pegar capturas desde el portapapeles y drop de
  //    archivos (vía `getAsFile()`).
  for (const item of Array.from(source.items ?? [])) {
    if (item.kind !== "file") continue;
    pushIfNew(item.getAsFile());
  }

  // 2) `files` como red de seguridad: si el navegador sólo expone los
  //    archivos por aquí (caso raro), los recogemos igual. La dedup evita
  //    duplicados cuando ya los hayamos visto vía `items`.
  for (const file of Array.from(source.files ?? [])) {
    pushIfNew(file);
  }

  return files;
}