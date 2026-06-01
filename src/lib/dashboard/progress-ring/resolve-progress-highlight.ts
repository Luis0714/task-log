const HIGHLIGHT_THRESHOLD = 75;

export function resolveProgressHighlight(percent: number): boolean {
  return percent >= HIGHLIGHT_THRESHOLD;
}
