import { totalHoursBreakdown, type HoursBreakdown } from "@/lib/hours/hours-breakdown";
import { SPRINT_GOAL_SHARE_FONT_FAMILY } from "@/lib/sprints/load-sprint-goal-share-fonts";
import { sprintTimesShareImageColors } from "@/lib/sprints/sprint-times-share-image-colors";
import {
  SprintTimesShareBugHoursCell,
  SprintTimesShareComplianceCell,
  SprintTimesShareDevHoursCell,
  SprintTimesShareExpectedHoursCell,
  SprintTimesShareNewsHoursCell,
  SprintTimesShareSubColumnHeader,
  SprintTimesShareWeekTotalCell,
} from "@/lib/sprints/sprint-times-share-image-value-cell";
import { SPRINT_TIMES_SHARE_LABELS } from "@/lib/sprints/sprint-times-share-labels";
import {
  SPRINT_TIMES_SHARE_IMAGE_LAYOUT,
  sprintTimesShareImageTheme,
} from "@/lib/sprints/sprint-times-share-image-theme";
import type {
  SprintTimesShareColumn,
  SprintTimesSharePayload,
  SprintTimesShareTableRow,
} from "@/lib/sprints/sprint-times-share-types";

function weekGroupBackground(weekIndex: number, emphasized = false): string {
  return sprintTimesShareImageColors.resolveWeekGroupBackground(weekIndex, emphasized);
}

function WeekGroupHeader({
  label,
  dateRangeLabel,
  workingDaysCount,
  weekIndex,
}: Readonly<{
  label: string;
  dateRangeLabel: string;
  workingDaysCount: number;
  weekIndex: number;
}>) {
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
        backgroundColor: weekGroupBackground(weekIndex),
        width: "100%",
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700, color: sprintTimesShareImageTheme.text }}>
        {label}
      </span>
      {dateRangeLabel ? (
        <span style={{ fontSize: 11, color: sprintTimesShareImageTheme.muted }}>{dateRangeLabel}</span>
      ) : null}
      <span style={{ fontSize: 10, color: sprintTimesShareImageTheme.muted }}>
        {workingDaysCount} {workingDaysCount === 1 ? "día hábil" : "días hábiles"}
      </span>
    </div>
  );
}

function WeekGroupCells({
  breakdown,
  weekIndex,
  emphasized = false,
}: Readonly<{
  breakdown: HoursBreakdown;
  weekIndex: number;
  emphasized?: boolean;
}>) {
  const weekTotal = totalHoursBreakdown(breakdown);
  const cellBase: React.CSSProperties = {
    display: "flex",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 10px",
  };
  const divider = {
    borderLeft: `1px solid ${sprintTimesShareImageTheme.border}`,
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        borderRadius: 8,
        backgroundColor: weekGroupBackground(weekIndex, emphasized),
        width: "100%",
      }}
    >
      <div style={cellBase}>
        <SprintTimesShareDevHoursCell value={breakdown.taskHours} />
      </div>
      <div style={{ ...cellBase, ...divider }}>
        <SprintTimesShareBugHoursCell value={breakdown.bugHours} />
      </div>
      <div style={{ ...cellBase, ...divider }}>
        <SprintTimesShareNewsHoursCell value={breakdown.newsHours} />
      </div>
      <div style={{ ...cellBase, ...divider }}>
        <SprintTimesShareWeekTotalCell value={weekTotal} />
      </div>
    </div>
  );
}

const ASSIGNEE_CHAR_WIDTH = 8.5;
const ASSIGNEE_MIN_WIDTH = 150;
const ASSIGNEE_MAX_WIDTH = 380;

/**
 * Ancho fijo suficiente para el nombre más largo en una sola línea: los
 * nombres completos nunca se truncan ni saltan de línea.
 */
function resolveAssigneeColumnWidth(rows: readonly SprintTimesShareTableRow[]): number {
  const longest = rows.reduce((max, row) => Math.max(max, row.assignee.length), 0);
  return Math.min(
    ASSIGNEE_MAX_WIDTH,
    Math.max(ASSIGNEE_MIN_WIDTH, Math.round(longest * ASSIGNEE_CHAR_WIDTH) + 16),
  );
}

/**
 * La columna de semana aloja 4 sub-celdas (Desarrollo/Bugs/Novedades/Total),
 * por eso pesa ~3-4× el resto; Esperadas, Total y % Cumplimiento son un solo
 * valor y quedan angostas.
 */
function resolveColumnFlex(column: SprintTimesShareColumn): number {
  if (column.kind === "week") return 3.2;
  if (column.kind === "expectedHours") return 0.6;
  if (column.kind === "compliance") return 0.7;
  return 0.8;
}

function resolveColumnStyle(
  column: SprintTimesShareColumn,
  assigneeWidth: number,
): React.CSSProperties {
  if (column.kind === "assignee") {
    return { width: assigneeWidth, flexShrink: 0 };
  }
  return { flex: resolveColumnFlex(column) };
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
        workingDaysCount={column.week.workingDaysCount}
        weekIndex={column.weekIndex}
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

  if (column.kind === "expectedHours") {
    return (
      <span style={{ fontSize: 13, fontWeight: 700, color: sprintTimesShareImageTheme.muted }}>
        {SPRINT_TIMES_SHARE_LABELS.expectedHoursColumn}
      </span>
    );
  }

  if (column.kind === "compliance") {
    return (
      <span style={{ fontSize: 13, fontWeight: 700, color: sprintTimesShareImageTheme.muted }}>
        {SPRINT_TIMES_SHARE_LABELS.complianceColumn}
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
        <div style={{ display: "flex", flex: 1, justifyContent: "center" }}>
          <SprintTimesShareSubColumnHeader kind="news" label={SPRINT_TIMES_SHARE_LABELS.news} />
        </div>
        <div style={{ display: "flex", flex: 1, justifyContent: "center" }}>
          <SprintTimesShareSubColumnHeader kind="clock" label={SPRINT_TIMES_SHARE_LABELS.total} />
        </div>
      </div>
    );
  }

  if (column.kind === "expectedHours") {
    return (
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 700,
          color: sprintTimesShareImageTheme.muted,
        }}
      >
        {SPRINT_TIMES_SHARE_LABELS.hours.toUpperCase()}
      </span>
    );
  }

  if (column.kind === "compliance") {
    return (
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 700,
          color: sprintTimesShareImageTheme.muted,
        }}
      >
        %
      </span>
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
          whiteSpace: "nowrap",
        }}
      >
        {row.assignee}
      </span>
    );
  }

  if (column.kind === "week") {
    const breakdown = row.weeks[column.weekIndex];
    if (!breakdown) return <span style={{ display: "flex" }} />;
    return (
      <WeekGroupCells breakdown={breakdown} weekIndex={column.weekIndex} emphasized={row.emphasized} />
    );
  }

  if (column.kind === "expectedHours") {
    if (row.weekExpectedHours !== null) {
      return <SprintTimesShareExpectedHoursCell value={row.weekExpectedHours} />;
    }
    return <SprintTimesShareExpectedHoursCell value={row.expectedHours} />;
  }

  if (column.kind === "weekTotal") {
    if (!row.weekTotal) return <span style={{ display: "flex" }} />;
    return <SprintTimesShareWeekTotalCell value={totalHoursBreakdown(row.weekTotal)} />;
  }

  if (column.kind === "compliance") {
    const level = row.weekSemaforo ?? row.semaforo;
    const pct = row.weekCompliancePct ?? row.compliancePct;
    return <SprintTimesShareComplianceCell level={level} pct={pct} />;
  }

  if (!row.sprint) return <span style={{ display: "flex" }} />;
  return <SprintTimesShareWeekTotalCell value={totalHoursBreakdown(row.sprint)} />;
}

function TableRow({
  columns,
  row,
  assigneeWidth,
}: Readonly<{
  columns: SprintTimesShareColumn[];
  row: SprintTimesShareTableRow;
  assigneeWidth: number;
}>) {
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
            ...resolveColumnStyle(column, assigneeWidth),
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

export function SprintTimesShareImageTableSection({ payload }: Readonly<{ payload: SprintTimesSharePayload }>) {
  const { horizontalPadding } = SPRINT_TIMES_SHARE_IMAGE_LAYOUT;
  const { columns, rows, teamTotalRow } = payload.table;
  const assigneeWidth = resolveAssigneeColumnWidth([...rows, teamTotalRow]);

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
              ...resolveColumnStyle(column, assigneeWidth),
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
              ...resolveColumnStyle(column, assigneeWidth),
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
          <TableRow
            key={row.assignee}
            columns={columns}
            row={row}
            assigneeWidth={assigneeWidth}
          />
        ))}
        <TableRow columns={columns} row={teamTotalRow} assigneeWidth={assigneeWidth} />
      </div>
    </div>
  );
}
