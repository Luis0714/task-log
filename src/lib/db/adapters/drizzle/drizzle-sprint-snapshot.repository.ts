import "server-only";

import { desc, eq } from "drizzle-orm";

import {
  ensureSprintGoalIdByScope,
  sprintGoalScopeConditions,
} from "@/lib/db/adapters/drizzle/drizzle-sprint-goal-scope";
import { getDb } from "@/lib/db/client";
import type { SprintGoalScope } from "@/lib/db/ports/sprint-story-goal.repository.port";
import type { SprintSnapshotRepository } from "@/lib/db/ports/sprint-snapshot.repository.port";
import {
  sprintGoals,
  sprintSnapshots,
  sprintStorySnapshots,
} from "@/lib/db/schema";
import { buildSprintSnapshotSummary } from "@/lib/sprints/build-sprint-snapshot-summary";
import type {
  SprintSnapshotData,
  SprintSnapshotSummary,
  SprintStorySnapshotData,
} from "@/lib/sprints/sprint-snapshot-types";

type SnapshotRow = typeof sprintSnapshots.$inferSelect;
type StoryRow = typeof sprintStorySnapshots.$inferSelect;

function mapSummary(row: SnapshotRow): SprintSnapshotSummary {
  return {
    goalsTotalCount: row.goalsTotalCount,
    goalsAchievedCount: row.goalsAchievedCount,
    goalsPartialCount: row.goalsPartialCount,
    goalsMissedCount: row.goalsMissedCount,
    goalsExcludedCount: row.goalsExcludedCount,
    goalsNoTargetCount: row.goalsNoTargetCount,
    storyPointsInGoal: row.storyPointsInGoal,
    storyPointsAchieved: row.storyPointsAchieved,
  };
}

function mapStory(row: StoryRow): SprintStorySnapshotData {
  return {
    workItemId: row.workItemId,
    title: row.title,
    assignedTo: row.assignedTo,
    effort: row.effort,
    includedInGoal: row.includedInGoal,
    baselineStateName: row.baselineStateName,
    baselineTacTagName: row.baselineTacTagName,
    targetStateName: row.targetStateName,
    targetTacTagName: row.targetTacTagName,
    finalStateName: row.finalStateName,
    finalTacTagName: row.finalTacTagName,
    goalStatus: row.goalStatus,
    observation: row.observation,
  };
}

function mapSnapshot(row: SnapshotRow, stories: StoryRow[]): SprintSnapshotData {
  return {
    id: row.id,
    version: row.version,
    finalizedAt: row.finalizedAt,
    finalizedByUserId: row.finalizedByUserId,
    finalizedByDisplayName: row.finalizedByDisplayName,
    source: row.source,
    generalObjective: row.generalObjective,
    sprintName: row.sprintName,
    sprintStartDate: row.sprintStartDate,
    sprintFinishDate: row.sprintFinishDate,
    summary: mapSummary(row),
    stories: stories.map(mapStory),
  };
}

async function findLatestSnapshotRow(scope: SprintGoalScope): Promise<SnapshotRow | null> {
  const rows = await getDb()
    .select({
      id: sprintSnapshots.id,
      sprintGoalId: sprintSnapshots.sprintGoalId,
      version: sprintSnapshots.version,
      finalizedAt: sprintSnapshots.finalizedAt,
      finalizedByUserId: sprintSnapshots.finalizedByUserId,
      finalizedByDisplayName: sprintSnapshots.finalizedByDisplayName,
      source: sprintSnapshots.source,
      generalObjective: sprintSnapshots.generalObjective,
      sprintName: sprintSnapshots.sprintName,
      sprintStartDate: sprintSnapshots.sprintStartDate,
      sprintFinishDate: sprintSnapshots.sprintFinishDate,
      goalsTotalCount: sprintSnapshots.goalsTotalCount,
      goalsAchievedCount: sprintSnapshots.goalsAchievedCount,
      goalsPartialCount: sprintSnapshots.goalsPartialCount,
      goalsMissedCount: sprintSnapshots.goalsMissedCount,
      goalsExcludedCount: sprintSnapshots.goalsExcludedCount,
      goalsNoTargetCount: sprintSnapshots.goalsNoTargetCount,
      storyPointsInGoal: sprintSnapshots.storyPointsInGoal,
      storyPointsAchieved: sprintSnapshots.storyPointsAchieved,
      createdAt: sprintSnapshots.createdAt,
    })
    .from(sprintSnapshots)
    .innerJoin(sprintGoals, eq(sprintSnapshots.sprintGoalId, sprintGoals.id))
    .where(sprintGoalScopeConditions(scope))
    .orderBy(desc(sprintSnapshots.version))
    .limit(1);

  return rows[0] ?? null;
}

async function listStoriesBySnapshotId(snapshotId: string): Promise<StoryRow[]> {
  return getDb()
    .select()
    .from(sprintStorySnapshots)
    .where(eq(sprintStorySnapshots.sprintSnapshotId, snapshotId))
    .orderBy(sprintStorySnapshots.workItemId);
}

async function resolveNextVersion(sprintGoalId: string): Promise<number> {
  const rows = await getDb()
    .select({ version: sprintSnapshots.version })
    .from(sprintSnapshots)
    .where(eq(sprintSnapshots.sprintGoalId, sprintGoalId))
    .orderBy(desc(sprintSnapshots.version))
    .limit(1);

  return (rows[0]?.version ?? 0) + 1;
}

export const drizzleSprintSnapshotRepository: SprintSnapshotRepository = {
  async getLatestByScope(scope) {
    const snapshotRow = await findLatestSnapshotRow(scope);
    if (!snapshotRow) return null;

    const stories = await listStoriesBySnapshotId(snapshotRow.id);
    return mapSnapshot(snapshotRow, stories);
  },

  async existsByScope(scope) {
    const snapshotRow = await findLatestSnapshotRow(scope);
    return snapshotRow !== null;
  },

  async save(scope, input) {
    const sprintGoalId = await ensureSprintGoalIdByScope(scope);
    const version = await resolveNextVersion(sprintGoalId);
    const summary = buildSprintSnapshotSummary(input.stories);
    const finalizedAt = input.finalizedAt ?? new Date();

    const inserted = await getDb().transaction(async (tx) => {
      const snapshotRows = await tx
        .insert(sprintSnapshots)
        .values({
          sprintGoalId,
          version,
          finalizedAt,
          finalizedByUserId: input.finalizedByUserId ?? null,
          finalizedByDisplayName: input.finalizedByDisplayName?.trim() || null,
          source: input.source,
          generalObjective: input.generalObjective?.trim() || null,
          sprintName: input.sprintName?.trim() || null,
          sprintStartDate: input.sprintStartDate?.trim() || null,
          sprintFinishDate: input.sprintFinishDate?.trim() || null,
          goalsTotalCount: summary.goalsTotalCount,
          goalsAchievedCount: summary.goalsAchievedCount,
          goalsPartialCount: summary.goalsPartialCount,
          goalsMissedCount: summary.goalsMissedCount,
          goalsExcludedCount: summary.goalsExcludedCount,
          goalsNoTargetCount: summary.goalsNoTargetCount,
          storyPointsInGoal: summary.storyPointsInGoal,
          storyPointsAchieved: summary.storyPointsAchieved,
        })
        .returning();

      const snapshot = snapshotRows[0];
      if (!snapshot) {
        throw new Error("No se pudo guardar la retrospectiva del sprint.");
      }

      if (input.stories.length > 0) {
        await tx.insert(sprintStorySnapshots).values(
          input.stories.map((story) => ({
            sprintSnapshotId: snapshot.id,
            workItemId: story.workItemId,
            title: story.title,
            assignedTo: story.assignedTo,
            effort: story.effort,
            includedInGoal: story.includedInGoal,
            baselineStateName: story.baselineStateName,
            baselineTacTagName: story.baselineTacTagName,
            targetStateName: story.targetStateName,
            targetTacTagName: story.targetTacTagName,
            finalStateName: story.finalStateName,
            finalTacTagName: story.finalTacTagName,
            goalStatus: story.goalStatus,
            observation: story.observation,
          })),
        );
      }

      return snapshot;
    });

    const stories = await listStoriesBySnapshotId(inserted.id);
    return mapSnapshot(inserted, stories);
  },
};
