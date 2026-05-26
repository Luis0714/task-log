import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";

export function buildDailySummary(
  inProgress: Array<{ title: string }>,
  history: CopilotHistoryEntry[],
): string {
  if (inProgress.length > 0) {
    const focus = inProgress
      .slice(0, 2)
      .map((item) => item.title)
      .join(" y ");
    return `Avancé en ${focus}.`;
  }

  const recentOk = history.find((entry) => entry.ok);
  if (recentOk) {
    const cleaned = recentOk.summary.replace(/^(?:TaskPilot|NeosView):\s*/i, "").trim();
    return cleaned.length > 140 ? `${cleaned.slice(0, 137)}…` : cleaned;
  }

  return "Sin actividad registrada recientemente. Registra tiempo para generar tu resumen.";
}
