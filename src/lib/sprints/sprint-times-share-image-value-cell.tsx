import type { HoursBreakdown } from "@/lib/hours/hours-breakdown";
import { formatHours } from "@/lib/dashboard/format-hours";
import { totalHoursBreakdown } from "@/lib/hours/hours-breakdown";
import {
  SprintTimesShareBugIconSvg,
  SprintTimesShareClockIconSvg,
  SprintTimesShareDevIconSvg,
} from "@/lib/sprints/sprint-times-share-icon-svgs";
import { sprintTimesShareImageColors } from "@/lib/sprints/sprint-times-share-image-colors";
import { sprintTimesShareImageTheme } from "@/lib/sprints/sprint-times-share-image-theme";

function HoursValue({
  value,
  icon,
  color,
  fontSize = 15,
  fontWeight = 600,
}: {
  value: number;
  icon: "dev" | "bug" | "clock";
  color: string;
  fontSize?: number;
  fontWeight?: number;
}) {
  const Icon =
    icon === "dev"
      ? SprintTimesShareDevIconSvg
      : icon === "bug"
        ? SprintTimesShareBugIconSvg
        : SprintTimesShareClockIconSvg;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      <Icon size={14} color={color} />
      <span style={{ fontSize, fontWeight, color: sprintTimesShareImageTheme.text }}>
        {formatHours(value)}
      </span>
    </div>
  );
}

export function SprintTimesShareDevHoursCell({ value }: { value: number }) {
  return (
    <HoursValue
      value={value}
      icon="dev"
      color={sprintTimesShareImageColors.development}
    />
  );
}

export function SprintTimesShareBugHoursCell({ value }: { value: number }) {
  return (
    <HoursValue value={value} icon="bug" color={sprintTimesShareImageColors.bug} />
  );
}

export function SprintTimesShareBreakdownCell({
  breakdown,
  emphasized = false,
}: {
  breakdown: HoursBreakdown;
  emphasized?: boolean;
}) {
  const total = totalHoursBreakdown(breakdown);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <HoursValue
        value={total}
        icon="clock"
        color={sprintTimesShareImageColors.sprintTotal}
        fontSize={emphasized ? 16 : 15}
        fontWeight={emphasized ? 700 : 600}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <HoursValue
          value={breakdown.taskHours}
          icon="dev"
          color={sprintTimesShareImageColors.development}
          fontSize={12}
          fontWeight={500}
        />
        <HoursValue
          value={breakdown.bugHours}
          icon="bug"
          color={sprintTimesShareImageColors.bug}
          fontSize={12}
          fontWeight={500}
        />
      </div>
    </div>
  );
}

export function SprintTimesShareSubColumnHeader({
  kind,
  label,
}: {
  kind: "dev" | "bug" | "total";
  label: string;
}) {
  const color =
    kind === "dev" ? sprintTimesShareImageColors.development
    : kind === "bug" ? sprintTimesShareImageColors.bug
    : sprintTimesShareImageColors.sprintTotal;
  const Icon =
    kind === "dev" ? SprintTimesShareDevIconSvg
    : kind === "bug" ? SprintTimesShareBugIconSvg
    : SprintTimesShareClockIconSvg;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      <Icon size={12} color={color} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: sprintTimesShareImageTheme.muted,
        }}
      >
        {label.toUpperCase()}
      </span>
    </div>
  );
}

export function SprintTimesShareWeekTotalCell({ value }: { value: number }) {
  return (
    <HoursValue
      value={value}
      icon="clock"
      color={sprintTimesShareImageColors.sprintTotal}
      fontWeight={700}
    />
  );
}
