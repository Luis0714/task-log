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
  news: "#7c3aed",
  sprintTotal: "#1741b5",
  expectedHours: "#0c4a6e",
  semaforoVerde: "#0f766e",
  semaforoVerdeBg: "rgba(16, 185, 129, 0.15)",
  semaforoAmarillo: "#b45309",
  semaforoAmarilloBg: "rgba(245, 158, 11, 0.18)",
  semaforoRojo: "#b91c1c",
  semaforoRojoBg: "rgba(239, 68, 68, 0.18)",
  resolveWeekGroupBackground,
} as const;
