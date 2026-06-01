import { SPRINT_GOAL_SHARE_BRAND_WORDMARK } from "@/lib/sprints/sprint-goal-share-brand-wordmark";
import { sprintGoalShareTheme } from "@/lib/sprints/sprint-goal-share-theme";
import { StyleSheet, Text } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  wordmark: {
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.25,
  },
  neos: {
    color: sprintGoalShareTheme.brand,
  },
  view: {
    color: sprintGoalShareTheme.text,
  },
});

export function SprintGoalSharePdfBrandWordmark() {
  return (
    <Text style={styles.wordmark}>
      <Text style={styles.neos}>{SPRINT_GOAL_SHARE_BRAND_WORDMARK.neos}</Text>
      <Text style={styles.view}>{SPRINT_GOAL_SHARE_BRAND_WORDMARK.view}</Text>
    </Text>
  );
}
