import { kpiProgressPercent } from "@/lib/dashboard/kpi-variant";
import { resolveKpiVariantFromPercent } from "@/lib/dashboard/progress-ring/resolve-kpi-variant-from-percent";
import { resolveProgressHighlight } from "@/lib/dashboard/progress-ring/resolve-progress-highlight";
import type {
  ProgressRingKpiViewModel,
  ProgressRingViewModel,
} from "@/lib/dashboard/progress-ring/types";
import type { SprintPbiProgress } from "@/lib/dashboard/types";
import { formatStoryPoints } from "@/lib/dashboard/work-item-selectors";
import type { SprintBugQualityMetrics, SprintGoalMetrics } from "@/lib/sprints/sprint-stats-types";

export function buildGoalProgressRingViewModel(goal: SprintGoalMetrics): ProgressRingViewModel {
  const { summary, achievementPercent } = goal;

  return {
    percent: achievementPercent,
    completedCount: summary.goalsAchievedCount,
    totalCount: summary.goalsTotalCount,
    highlight: resolveProgressHighlight(achievementPercent),
    emptyMessage: "Sin historias incluidas en el objetivo del sprint.",
    breakdown: [
      {
        id: "achieved",
        label: "Cumplidas",
        count: summary.goalsAchievedCount,
        tone: "success",
      },
      {
        id: "partial",
        label: "Parciales",
        count: summary.goalsPartialCount,
        tone: "warning",
      },
      {
        id: "missed",
        label: "No cumplidas",
        count: summary.goalsMissedCount,
        tone: "danger",
      },
    ],
  };
}

/** KPI emparejado al anillo: historias cumplidas vs comprometidas, con SP como detalle. */
export function buildGoalAchievementKpiViewModel(goal: SprintGoalMetrics): ProgressRingKpiViewModel {
  const { summary, achievementPercent } = goal;
  const { goalsTotalCount, goalsAchievedCount, storyPointsInGoal, storyPointsAchieved } = summary;

  const storyPointsHint =
    storyPointsInGoal > 0
      ? `${formatStoryPoints(storyPointsAchieved)} / ${formatStoryPoints(storyPointsInGoal)} SP`
      : undefined;

  return {
    label: "Cumplidas / comprometidas",
    value:
      goalsTotalCount > 0 ? `${goalsAchievedCount} / ${goalsTotalCount}` : "Sin historias",
    hint: storyPointsHint,
    progress: achievementPercent,
    variant: resolveKpiVariantFromPercent(achievementPercent),
    visible: goalsTotalCount > 0 || storyPointsInGoal > 0,
  };
}

export function buildBugProgressRingViewModel(bugs: SprintBugQualityMetrics): ProgressRingViewModel {
  return {
    percent: bugs.attendedPercent,
    completedCount: bugs.attended,
    totalCount: bugs.total,
    highlight: resolveProgressHighlight(bugs.attendedPercent),
    emptyMessage: "Sin bugs en este sprint.",
    breakdown: [
      {
        id: "attended",
        label: "Atendidos",
        count: bugs.attended,
        tone: "success",
      },
      {
        id: "open",
        label: "Abiertos",
        count: bugs.open,
        tone: "danger",
      },
      {
        id: "unassigned",
        label: "Sin asignar",
        count: bugs.unassigned,
        tone: "warning",
      },
    ],
  };
}

export function buildGoalBugsKpiViewModel(bugs: SprintBugQualityMetrics): ProgressRingKpiViewModel {
  const attended = bugs.goalBugsTotal - bugs.goalBugsOpen;
  const progress = kpiProgressPercent(attended, bugs.goalBugsTotal);

  return {
    label: "Bugs en HUs del objetivo",
    value: `${attended} / ${bugs.goalBugsTotal}`,
    progress,
    variant:
      bugs.goalBugsOpen > 0 ? "warning" : bugs.goalBugsTotal > 0 ? "success" : "default",
    visible: bugs.goalBugsTotal > 0,
  };
}

export function buildPbiProgressRingViewModel(progress: SprintPbiProgress): ProgressRingViewModel {
  const breakdown: ProgressRingViewModel["breakdown"] = [
    {
      id: "completed",
      label: "Desarrolladas",
      count: progress.completedCount,
      tone: "success",
    },
    {
      id: "pending",
      label: "Pendientes",
      count: progress.pendingCount,
      tone: "warning",
    },
  ];

  if (progress.otherCount > 0) {
    breakdown.push({
      id: "inProgress",
      label: "En progreso",
      count: progress.otherCount,
      tone: "info" as const,
    });
  }

  return {
    percent: progress.percent,
    completedCount: progress.completedCount,
    totalCount: progress.totalCount,
    highlight: resolveProgressHighlight(progress.percent),
    emptyMessage: "Sin historias de usuario asignadas en este sprint.",
    title: "Progreso historias de usuario",
    breakdown,
  };
}
