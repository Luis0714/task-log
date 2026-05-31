import { BRAND_MARK_HEX } from "@/lib/brand/isotipo-badge-og";
import { IsotipoBadgeOgSvg } from "@/lib/brand/isotipo-badge-og";
import {
  formatSprintGoalShareDate,
  formatSprintGoalShareDateTime,
} from "@/lib/sprints/format-sprint-goal-share";
import { SPRINT_GOAL_SHARE_FONT_FAMILY } from "@/lib/sprints/load-sprint-goal-share-fonts";
import { SPRINT_GOAL_SHARE_MAX_VISIBLE_STORIES } from "@/lib/sprints/sprint-goal-share-types";
import type { SprintGoalSharePayload } from "@/lib/sprints/sprint-goal-share-types";

const IMAGE_WIDTH = 1200;
const HEADER_HEIGHT = 168;
const SUMMARY_HEIGHT = 220;
const TABLE_HEADER_HEIGHT = 44;
const TABLE_ROW_HEIGHT = 52;
const OVERFLOW_HEIGHT = 36;
const FOOTER_HEIGHT = 96;
const HORIZONTAL_PADDING = 48;

const colors = {
  background: "#f8f8fa",
  card: "#ffffff",
  border: "#e4e4e7",
  text: "#0c0c0e",
  muted: "#71717a",
  brand: BRAND_MARK_HEX,
  tableHeader: "#f4f4f5",
};

function computeShareImageHeight(payload: SprintGoalSharePayload): number {
  const visibleRows = Math.min(
    payload.visibleStories.length,
    SPRINT_GOAL_SHARE_MAX_VISIBLE_STORIES,
  );
  const overflowHeight = payload.overflowCount > 0 ? OVERFLOW_HEIGHT : 0;

  return (
    HEADER_HEIGHT +
    SUMMARY_HEIGHT +
    TABLE_HEADER_HEIGHT +
    visibleRows * TABLE_ROW_HEIGHT +
    overflowHeight +
    FOOTER_HEIGHT +
    48
  );
}

function truncateText(value: string, maxLength: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: "16px 20px",
        borderRadius: 12,
        backgroundColor: colors.tableHeader,
        flex: 1,
      }}
    >
      <span style={{ fontSize: 28, fontWeight: 700, color: colors.text }}>{value}</span>
      <span style={{ fontSize: 16, color: colors.muted }}>{label}</span>
    </div>
  );
}

export function getSprintGoalShareImageSize(payload: SprintGoalSharePayload) {
  return {
    width: IMAGE_WIDTH,
    height: computeShareImageHeight(payload),
  };
}

export function SprintGoalShareImage({ payload }: { payload: SprintGoalSharePayload }) {
  const generatedDate = formatSprintGoalShareDate(payload.generatedAt);
  const generatedDateTime = formatSprintGoalShareDateTime(payload.generatedAt);
  const objectiveText =
    payload.generalObjective.trim() || "Sin objetivo general registrado.";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: SPRINT_GOAL_SHARE_FONT_FAMILY,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${HORIZONTAL_PADDING}px ${HORIZONTAL_PADDING}px 24px`,
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: colors.card,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <IsotipoBadgeOgSvg size={56} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 700 }}>{payload.platformName}</span>
            <span style={{ fontSize: 18, color: colors.muted }}>
              Objetivo del sprint
            </span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6,
            maxWidth: 420,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 700, textAlign: "right" }}>
            {truncateText(payload.sprintName, 48)}
          </span>
          <span style={{ fontSize: 16, color: colors.muted, textAlign: "right" }}>
            {payload.projectName}
          </span>
          <span style={{ fontSize: 14, color: colors.muted, textAlign: "right" }}>
            Generado el {generatedDate}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          padding: `${24}px ${HORIZONTAL_PADDING}px`,
          backgroundColor: colors.card,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: colors.brand }}>
            Objetivo general
          </span>
          <span style={{ fontSize: 18, lineHeight: 1.5 }}>{truncateText(objectiveText, 280)}</span>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <SummaryMetric label="Historias en el objetivo" value={payload.summary.totalStoriesInGoal} />
          <SummaryMetric label="Estados objetivo" value={payload.summary.uniqueTargetStates} />
          <SummaryMetric label="TAC objetivo" value={payload.summary.uniqueTargetTacs} />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: `0 ${HORIZONTAL_PADDING}px`,
          backgroundColor: colors.card,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: TABLE_HEADER_HEIGHT,
            borderBottom: `1px solid ${colors.border}`,
            backgroundColor: colors.tableHeader,
            fontSize: 14,
            fontWeight: 700,
            color: colors.muted,
          }}
        >
          <span style={{ flex: 2, paddingLeft: 12 }}>Historia de usuario</span>
          <span style={{ flex: 1, paddingLeft: 12 }}>Estado objetivo</span>
          <span style={{ flex: 1, paddingLeft: 12 }}>TAC objetivo</span>
        </div>

        {payload.visibleStories.map((story) => (
          <div
            key={story.workItemId}
            style={{
              display: "flex",
              alignItems: "center",
              minHeight: TABLE_ROW_HEIGHT,
              borderBottom: `1px solid ${colors.border}`,
              fontSize: 16,
            }}
          >
            <div
              style={{
                flex: 2,
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: "10px 12px",
              }}
            >
              <span style={{ fontWeight: 700 }}>#{story.workItemId}</span>
              <span style={{ color: colors.muted }}>{truncateText(story.title, 72)}</span>
            </div>
            <span style={{ flex: 1, padding: "10px 12px" }}>{story.targetState}</span>
            <span style={{ flex: 1, padding: "10px 12px" }}>{story.targetTac}</span>
          </div>
        ))}

        {payload.overflowCount > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              height: OVERFLOW_HEIGHT,
              padding: "0 12px",
              fontSize: 14,
              color: colors.muted,
              fontStyle: "italic",
            }}
          >
            Y {payload.overflowCount} historia{payload.overflowCount === 1 ? "" : "s"} adicional
            {payload.overflowCount === 1 ? "" : "es"}
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: `20px ${HORIZONTAL_PADDING}px ${HORIZONTAL_PADDING}px`,
          borderTop: `1px solid ${colors.border}`,
          backgroundColor: colors.card,
          fontSize: 14,
          color: colors.muted,
        }}
      >
        <span style={{ fontWeight: 700, color: colors.text }}>{payload.platformName}</span>
        <span>Generado el {generatedDateTime}</span>
        <span>{truncateText(payload.scopeLabel, 120)}</span>
        {payload.sprintDateRange ? <span>{payload.sprintDateRange}</span> : null}
      </div>
    </div>
  );
}
