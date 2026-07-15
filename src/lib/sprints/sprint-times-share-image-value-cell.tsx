import type { HoursBreakdown } from "@/lib/hours/hours-breakdown";
import { formatHours } from "@/lib/dashboard/format-hours";
import { totalHoursBreakdown } from "@/lib/hours/hours-breakdown";
import type { SemaforoLevel } from "@/lib/reports/hours/hours-report-types";
import {
  SprintTimesShareBugIconSvg,
  SprintTimesShareCalendarOffIconSvg,
  SprintTimesShareClockIconSvg,
  SprintTimesShareDevIconSvg,
} from "@/lib/sprints/sprint-times-share-icon-svgs";
import { sprintTimesShareImageColors } from "@/lib/sprints/sprint-times-share-image-colors";
import { sprintTimesShareImageTheme } from "@/lib/sprints/sprint-times-share-image-theme";

type CellIcon = "dev" | "bug" | "news" | "clock";

function HoursValue({
  value,
  icon,
  color,
  fontSize = 15,
  fontWeight = 600,
}: Readonly<{
  value: number;
  icon: CellIcon;
  color: string;
  fontSize?: number;
  fontWeight?: number;
}>) {
  const Icon =
    icon === "dev"
      ? SprintTimesShareDevIconSvg
      : icon === "bug"
        ? SprintTimesShareBugIconSvg
        : icon === "news"
          ? SprintTimesShareCalendarOffIconSvg
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

export function SprintTimesShareDevHoursCell({ value }: Readonly<{ value: number }>) {
  return (
    <HoursValue
      value={value}
      icon="dev"
      color={sprintTimesShareImageColors.development}
    />
  );
}

export function SprintTimesShareBugHoursCell({ value }: Readonly<{ value: number }>) {
  return (
    <HoursValue value={value} icon="bug" color={sprintTimesShareImageColors.bug} />
  );
}

export function SprintTimesShareNewsHoursCell({ value }: Readonly<{ value: number }>) {
  return (
    <HoursValue value={value} icon="news" color={sprintTimesShareImageColors.news} />
  );
}

export function SprintTimesShareExpectedHoursCell({ value }: Readonly<{ value: number }>) {
  return (
    <span
      style={{
        fontSize: 15,
        fontWeight: 700,
        color: sprintTimesShareImageColors.expectedHours,
      }}
    >
      {formatHours(value)}
    </span>
  );
}

export function SprintTimesShareComplianceCell({
  level,
  pct,
}: Readonly<{
  level: SemaforoLevel | null;
  pct: number | null;
}>) {
  if (level === null) {
    return (
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: sprintTimesShareImageTheme.muted,
        }}
      >
        SIN DATOS
      </span>
    );
  }
  const color =
    level === "verde"
      ? sprintTimesShareImageColors.semaforoVerde
      : level === "amarillo"
        ? sprintTimesShareImageColors.semaforoAmarillo
        : sprintTimesShareImageColors.semaforoRojo;
  const bg =
    level === "verde"
      ? sprintTimesShareImageColors.semaforoVerdeBg
      : level === "amarillo"
        ? sprintTimesShareImageColors.semaforoAmarilloBg
        : sprintTimesShareImageColors.semaforoRojoBg;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 10px",
        borderRadius: 9999,
        backgroundColor: bg,
        color,
        fontWeight: 700,
        fontSize: 13,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {pct ?? 0}%
    </div>
  );
}

export function SprintTimesShareBreakdownCell({
  breakdown,
  emphasized = false,
}: Readonly<{
  breakdown: HoursBreakdown;
  emphasized?: boolean;
}>) {
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
        <HoursValue
          value={breakdown.newsHours}
          icon="news"
          color={sprintTimesShareImageColors.news}
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
}: Readonly<{
  kind: CellIcon | "news";
  label: string;
}>) {
  const color =
    kind === "dev" ? sprintTimesShareImageColors.development
    : kind === "bug" ? sprintTimesShareImageColors.bug
    : kind === "news" ? sprintTimesShareImageColors.news
    : sprintTimesShareImageColors.sprintTotal;
  const Icon =
    kind === "dev" ? SprintTimesShareDevIconSvg
    : kind === "bug" ? SprintTimesShareBugIconSvg
    : kind === "news" ? SprintTimesShareCalendarOffIconSvg
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

export function SprintTimesShareWeekTotalCell({ value }: Readonly<{ value: number }>) {
  return (
    <HoursValue
      value={value}
      icon="clock"
      color={sprintTimesShareImageColors.sprintTotal}
      fontWeight={700}
    />
  );
}
