/** Info mínima de una HU de novedad para componer el detalle (ISP). */
export type NewsStoryInfo = Readonly<{
  type: string | null;
  title: string;
}>;

/** Separador entre entradas del detalle concatenado (CA-24). */
export const NEWS_DETAIL_DELIMITER = ". ";

/**
 * Detalle de novedades concatenado en una sola celda: `<tipo> - <título>`
 * por cada HU trabajada; si la HU no tiene tipo, queda solo el título
 * (CA-24). Las HU sin info o sin título se omiten.
 */
export function formatNewsDetail(
  storyIds: readonly number[],
  infoById: ReadonlyMap<number, NewsStoryInfo>,
): string {
  const entries: string[] = [];
  for (const id of storyIds) {
    const info = infoById.get(id);
    const title = info?.title.trim();
    if (!title) continue;
    const type = info?.type?.trim();
    entries.push(type ? `${type} - ${title}` : title);
  }
  return entries.join(NEWS_DETAIL_DELIMITER);
}
