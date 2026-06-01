import { sprintGoalShareImageColors } from "@/lib/sprints/sprint-goal-share-image-theme";

export type SprintGoalShareImageSummaryMetricProps = {
  label: string;
  value: number;
};

export function SprintGoalShareImageSummaryMetric({
  label,
  value,
}: SprintGoalShareImageSummaryMetricProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "16px 20px",
        borderRadius: 12,
        backgroundColor: sprintGoalShareImageColors.tableHeader,
        flex: 1,
      }}
    >
      <span style={{ fontSize: 28, fontWeight: 700, color: sprintGoalShareImageColors.text }}>
        {value}
      </span>
      <span style={{ fontSize: 16, color: sprintGoalShareImageColors.muted }}>{label}</span>
    </div>
  );
}
