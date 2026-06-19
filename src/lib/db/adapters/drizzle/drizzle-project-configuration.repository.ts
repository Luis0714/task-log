import "server-only";

import { and, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import type {
  ProjectConfigInput,
  ProjectConfigRow,
  ProjectConfigurationRepository,
} from "@/lib/db/ports/project-configuration.repository.port";
import { projectConfigurations } from "@/lib/db/schema";

export const drizzleProjectConfigurationRepository: ProjectConfigurationRepository = {
  async findByOrgAndProject(organization, project): Promise<ProjectConfigRow | null> {
    const rows = await getDb()
      .select()
      .from(projectConfigurations)
      .where(
        and(
          eq(projectConfigurations.organization, organization),
          eq(projectConfigurations.project, project),
        ),
      )
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      organization: row.organization,
      project: row.project,
      workingDateField: row.workingDateField,
      timezone: row.timezone,
      completedWorkField: row.completedWorkField,
      originalEstimateField: row.originalEstimateField,
      activityField: row.activityField,
      taskWorkItemType: row.taskWorkItemType,
      bugWorkItemType: row.bugWorkItemType,
      backlogItemType: row.backlogItemType,
      taskTodoState: row.taskTodoState,
      taskDoneState: row.taskDoneState,
      configSource: row.configSource,
      discoveredAt: row.discoveredAt,
      updatedAt: row.updatedAt,
    };
  },

  async upsert(organization, project, config: ProjectConfigInput): Promise<void> {
    await getDb()
      .insert(projectConfigurations)
      .values({
        organization,
        project,
        workingDateField: config.workingDateField,
        timezone: config.timezone,
        completedWorkField: config.completedWorkField,
        originalEstimateField: config.originalEstimateField,
        activityField: config.activityField,
        taskWorkItemType: config.taskWorkItemType,
        bugWorkItemType: config.bugWorkItemType,
        backlogItemType: config.backlogItemType,
        taskTodoState: config.taskTodoState,
        taskDoneState: config.taskDoneState,
        configSource: config.configSource,
        discoveredAt: config.discoveredAt,
      })
      .onConflictDoUpdate({
        target: [projectConfigurations.organization, projectConfigurations.project],
        set: {
          workingDateField: config.workingDateField,
          timezone: config.timezone,
          completedWorkField: config.completedWorkField,
          originalEstimateField: config.originalEstimateField,
          activityField: config.activityField,
          taskWorkItemType: config.taskWorkItemType,
          bugWorkItemType: config.bugWorkItemType,
          backlogItemType: config.backlogItemType,
          taskTodoState: config.taskTodoState,
          taskDoneState: config.taskDoneState,
          configSource: config.configSource,
          discoveredAt: config.discoveredAt,
          updatedAt: new Date(),
        },
      });
  },
};
