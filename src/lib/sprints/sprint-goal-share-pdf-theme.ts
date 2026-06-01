import { SPRINT_GOAL_SHARE_FONT_FAMILY } from "@/lib/sprints/load-sprint-goal-share-fonts";
import { sprintGoalShareTheme } from "@/lib/sprints/sprint-goal-share-theme";
import { StyleSheet } from "@react-pdf/renderer";

export const sprintGoalSharePdfStyles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: SPRINT_GOAL_SHARE_FONT_FAMILY,
    fontSize: 10,
    color: sprintGoalShareTheme.text,
    lineHeight: 1.4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: sprintGoalShareTheme.brand,
    marginBottom: 6,
  },
  objectiveSection: {
    marginBottom: 14,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: sprintGoalShareTheme.surfaceMuted,
    borderRadius: 8,
    padding: 10,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 2,
  },
  metricLabel: {
    color: sprintGoalShareTheme.muted,
    fontSize: 9,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: sprintGoalShareTheme.surfaceMuted,
    borderBottom: `1px solid ${sprintGoalShareTheme.border}`,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontWeight: 700,
    color: sprintGoalShareTheme.muted,
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottom: `1px solid ${sprintGoalShareTheme.border}`,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  colStory: { width: "52%" },
  colStateCell: {
    width: "24%",
    alignItems: "center",
    justifyContent: "center",
  },
  colState: { width: "24%" },
  colTag: { width: "24%" },
  overflowNote: {
    marginTop: 8,
    color: sprintGoalShareTheme.muted,
    fontStyle: "italic",
    fontSize: 9,
  },
  footer: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: `1px solid ${sprintGoalShareTheme.border}`,
    color: sprintGoalShareTheme.muted,
    fontSize: 9,
  },
  footerBrand: {
    color: sprintGoalShareTheme.text,
    fontWeight: 700,
    marginBottom: 4,
  },
});

export const sprintGoalSharePdfHeaderStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: `1px solid ${sprintGoalShareTheme.border}`,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexShrink: 1,
  },
  headerLeftText: {
    flexDirection: "column",
    gap: 8,
  },
  subtitle: {
    fontSize: 11,
    color: sprintGoalShareTheme.muted,
    lineHeight: 1.3,
  },
  headerRight: {
    alignItems: "flex-end",
    flexShrink: 0,
    maxWidth: 220,
    gap: 4,
  },
  sprintName: {
    fontSize: 13,
    fontWeight: 700,
    color: sprintGoalShareTheme.text,
    textAlign: "right",
  },
  meta: {
    fontSize: 9,
    color: sprintGoalShareTheme.muted,
    textAlign: "right",
  },
});
