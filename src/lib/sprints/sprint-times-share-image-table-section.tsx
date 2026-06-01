import type { HoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import { SPRINT_GOAL_SHARE_FONT_FAMILY } from "@/lib/sprints/load-sprint-goal-share-fonts";
import { sprintTimesShareImageColors } from "@/lib/sprints/sprint-times-share-image-colors";
import {
  SprintTimesShareBreakdownCell,
  SprintTimesShareBugHoursCell,
  SprintTimesShareDevHoursCell,
  SprintTimesShareSubColumnHeader,
} from "@/lib/sprints/sprint-times-share-image-value-cell";
import { SPRINT_TIMES_SHARE_LABELS } from "@/lib/sprints/sprint-times-share-labels";
import {
  SPRINT_TIMES_SHARE_IMAGE_LAYOUT,
  sprintTimesShareImageTheme,
  truncateSprintTimesShareText,
} from "@/lib/sprints/sprint-times-share-image-theme";
import type {
  SprintTimesShareColumn,
  SprintTimesSharePayload,
  SprintTimesShareTableRow,
} from "@/lib/sprints/sprint-times-share-types";

function weekGroupBackground(weekKey: "week1" | "week2", emphasized = false): string {
  if (weekKey === "week1") {
    return emphasized
      ? sprintTimesShareImageColors.week1GroupBackgroundEmphasis
      : sprintTimesShareImageColors.week1GroupBackground;
  }

  return emphasized
    ? sprintTimesShareImageColors.week2GroupBackgroundEmphasis
    : sprintTimesShareImageColors.week2GroupBackground;
}

function WeekGroupHeader({
  label,
  dateRangeLabel,
  weekKey,
}: {
  label: string;
  dateRangeLabel: string;
  weekKey: "week1" | "week2";
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "10px 12px",
        borderRadius: 8,
        backgroundColor: weekGroupBackground(weekKey),
        width: "100%",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700, color: sprintTimesShareImageTheme.text }}>
        {label}
      </span>
      {dateRangeLabel ? (
        <span style={{ fontSize: 11, color: sprintTimesShareImageTheme.muted }}>{dateRangeLabel}</span>
      ) : null}
    </div>
  );
}

function WeekGroupCells({
  breakdown,
  weekKey,
  emphasized = false,
}: {
  breakdown: HoursBreakdown;
  weekKey: "week1" | "week2";
  emphasized?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        borderRadius: 8,
        backgroundColor: weekGroupBackground(weekKey, emphasized),
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: "12px 10px",
        }}
      >
        <SprintTimesShareDevHoursCell value={breakdown.taskHours} />
      </div>
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: "12px 10px",
          borderLeft: `1px solid ${sprintTimesShareImageTheme.border}`,
        }}
      >
        <SprintTimesShareBugHoursCell value={breakdown.bugHours} />
      </div>
    </div>
  );
}

function resolveColumnFlex(column: SprintTimesShareColumn): number {
  if (column.kind === "assignee") return 1.15;
  if (column.kind === "week") return 1.2;
  return 0.95;
}

function renderColumnHeader(column: SprintTimesShareColumn) {
  if (column.kind === "assignee") {
    return (
      <span style={{ fontSize: 13, fontWeight: 700, color: sprintTimesShareImageTheme.muted }}>
        {SPRINT_TIMES_SHARE_LABELS.assigneeColumn}
      </span>
    );
  }

  if (column.kind === "week") {
    return (
      <WeekGroupHeader
        label={column.week.label}
        dateRangeLabel={column.week.dateRangeLabel}
        weekKey={column.weekKey}
      />
    );
  }

  if (column.kind === "weekTotal") {
    return (
      <span style={{ fontSize: 13, fontWeight: 700, color: sprintTimesShareImageTheme.muted }}>
        {column.label}
      </span>
    );
  }

  return (
    <span style={{ fontSize: 13, fontWeight: 700, color: sprintTimesShareImageTheme.muted }}>
      {SPRINT_TIMES_SHARE_LABELS.sprintTotalColumn}
    </span>
  );
}

function renderSubHeaderCell(column: SprintTimesShareColumn) {
  if (column.kind === "assignee") {
    return <span style={{ display: "flex" }} />;
  }

  if (column.kind === "week") {
    return (
      <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
        <div style={{ display: "flex", flex: 1, justifyContent: "center" }}>
          <SprintTimesShareSubColumnHeader kind="dev" label={SPRINT_TIMES_SHARE_LABELS.development} />
        </div>
        <div style={{ display: "flex", flex: 1, justifyContent: "center" }}>
          <SprintTimesShareSubColumnHeader kind="bug" label={SPRINT_TIMES_SHARE_LABELS.bugs} />
        </div>
      </div>
    );
  }

  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        color: sprintTimesShareImageTheme.muted,
      }}
    >
      {SPRINT_TIMES_SHARE_LABELS.total.toUpperCase()}
    </span>
  );
}

function renderRowCell(
  column: SprintTimesShareColumn,
  row: SprintTimesShareTableRow,
) {
  if (column.kind === "assignee") {
    return (
      <span
        style={{
          display: "flex",
          fontSize: 15,
          fontWeight: row.emphasized ? 700 : 600,
          color: sprintTimesShareImageTheme.text,
        }}
      >
        {truncateSprintTimesShareText(row.assignee, 28)}
      </span>
    );
  }

  if (column.kind === "week") {
    const breakdown = column.weekKey === "week1" ? row.week1 : row.week2;
    if (!breakdown) return <span style={{ display: "flex" }} />;
    return (
      <WeekGroupCells breakdown={breakdown} weekKey={column.weekKey} emphasized={row.emphasized} />
    );
  }

  if (column.kind === "weekTotal") {
    if (!row.weekTotal) return <span style={{ display: "flex" }} />;
    return <SprintTimesShareBreakdownCell breakdown={row.weekTotal} emphasized={row.emphasized} />;
  }

  if (!row.sprint) return <span style={{ display: "flex" }} />;
  return <SprintTimesShareBreakdownCell breakdown={row.sprint} emphasized={row.emphasized} />;
}

function TableRow({
  columns,
  row,
}: {
  columns: SprintTimesShareColumn[];
  row: SprintTimesShareTableRow;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        minHeight: SPRINT_TIMES_SHARE_IMAGE_LAYOUT.tableRowHeight,
        padding: "0 12px",
        borderBottom: `1px solid ${sprintTimesShareImageTheme.border}`,
        backgroundColor: row.emphasized ? "rgba(244, 244, 245, 0.55)" : sprintTimesShareImageTheme.card,
      }}
    >
      {columns.map((column, index) => (
        <div
          key={`${column.kind}-${index}`}
          style={{
            display: "flex",
            flex: resolveColumnFlex(column),
            minWidth: 0,
            alignItems: "center",
            justifyContent: column.kind === "assignee" ? "flex-start" : "center",
          }}
        >
          {renderRowCell(column, row)}
        </div>
      ))}
    </div>
  );
}

export function SprintTimesShareImageTableSection({ payload }: { payload: SprintTimesSharePayload }) {
  const { horizontalPadding } = SPRINT_TIMES_SHARE_IMAGE_LAYOUT;
  const { columns, rows, teamTotalRow } = payload.table;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        padding: `0 ${horizontalPadding}px`,
        backgroundColor: sprintTimesShareImageTheme.card,
        fontFamily: SPRINT_GOAL_SHARE_FONT_FAMILY,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: SPRINT_TIMES_SHARE_IMAGE_LAYOUT.tableHeaderHeight,
          padding: "0 12px",
          borderBottom: `1px solid ${sprintTimesShareImageTheme.border}`,
          backgroundColor: sprintTimesShareImageTheme.surfaceMuted,
        }}
      >
        {columns.map((column, index) => (
          <div
            key={`header-${column.kind}-${index}`}
            style={{
              display: "flex",
              flex: resolveColumnFlex(column),
              minWidth: 0,
              alignItems: "center",
              justifyContent: column.kind === "assignee" ? "flex-start" : "center",
            }}
          >
            {renderColumnHeader(column)}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          minHeight: SPRINT_TIMES_SHARE_IMAGE_LAYOUT.subHeaderHeight,
          padding: "0 12px 8px",
          borderBottom: `1px solid ${sprintTimesShareImageTheme.border}`,
        }}
      >
        {columns.map((column, index) => (
          <div
            key={`sub-${column.kind}-${index}`}
            style={{
              display: "flex",
              flex: resolveColumnFlex(column),
              minWidth: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {renderSubHeaderCell(column)}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {rows.map((row) => (
          <TableRow key={row.assignee} columns={columns} row={row} />
        ))}
        <TableRow columns={columns} row={teamTotalRow} />
      </div>
    </div>
  );
}
