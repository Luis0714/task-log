/** Colores explícitos para imagen OG (equivalente a la UI en tema claro). */
const PALETTE = [
  {
    group: "rgba(139, 92, 246, 0.08)",
    groupEmphasis: "rgba(139, 92, 246, 0.12)",
  },
  {
    group: "rgba(227, 227, 232, 0.65)",
    groupEmphasis: "rgba(199, 199, 208, 0.75)",
  },
] as const;

function resolveWeekGroupBackground(weekIndex: number, emphasized: boolean): string {
  const palette = PALETTE[weekIndex % PALETTE.length];
  return emphasized ? palette.groupEmphasis : palette.group;
}

export const sprintTimesShareImageColors = {
  development: "#8b5cf6",
  bug: "#e11d48",
  sprintTotal: "#1741b5",
  resolveWeekGroupBackground,
} as const;
