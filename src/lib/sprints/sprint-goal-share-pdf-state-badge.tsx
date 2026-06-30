import { sprintGoalShareTheme } from "@/lib/sprints/sprint-goal-share-theme";
import { getStateExportBadgeStyle } from "@/lib/work-items/pbi-state-colors";
import type { AdoTaskStateDto } from "@/lib/schemas/ado-catalog";
import { StyleSheet, Text, View } from "@react-pdf/renderer";

const badgeStyles = StyleSheet.create({
  badge: {
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 8,
    fontWeight: 500,
    lineHeight: 1,
  },
  dot: {
    fontSize: 7,
    lineHeight: 1,
  },
  placeholder: {
    fontSize: 9,
    color: sprintGoalShareTheme.muted,
    lineHeight: 1,
    textAlign: "center",
  },
});

export type SprintGoalSharePdfStateBadgeProps = Readonly<{
  state: string;
  backlogStates: readonly AdoTaskStateDto[];
}>;

export function SprintGoalSharePdfStateBadge({
  state,
  backlogStates,
}: Readonly<SprintGoalSharePdfStateBadgeProps>) {
  if (!state || state === "—") {
    return <Text style={badgeStyles.placeholder}>{state}</Text>;
  }

  const badgeStyle = getStateExportBadgeStyle(backlogStates, state);

  return (
    <View
      style={[
        badgeStyles.badge,
        {
          borderColor: badgeStyle.borderColor,
          backgroundColor: badgeStyle.backgroundColor,
        },
      ]}
    >
      <Text style={[badgeStyles.label, { color: badgeStyle.color }]}>
        <Text style={[badgeStyles.dot, { color: badgeStyle.dotColor }]}>{"● "}</Text>
        {state}
      </Text>
    </View>
  );
}