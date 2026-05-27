import { z } from "zod";

export const adoProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

export const adoProjectsResponseSchema = z.object({
  projects: z.array(adoProjectSchema),
  defaultProject: z.string().optional(),
});

export const adoTeamSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const adoTeamsResponseSchema = z.object({
  teams: z.array(adoTeamSchema),
  suggestedTeam: z.string().optional(),
  defaultTeam: z.string().optional(),
});

export const adoSprintSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  timeFrame: z.enum(["past", "current", "future"]).optional(),
  startDate: z.string().optional(),
  finishDate: z.string().optional(),
});

export const adoWorkItemOptionSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  /** Description del work item en texto plano. */
  description: z.string().optional(),
  /** Acceptance Criteria del work item en texto plano. */
  acceptanceCriteria: z.string().optional(),
  type: z.string(),
  state: z.string(),
  assignedTo: z.string().optional(),
  priority: z.number().optional(),
  /** Effort / estimación de la historia (Microsoft.VSTS.Scheduling.Effort o Story Points). */
  effort: z.number().optional(),
  /** ID del work item padre (p. ej. HU de un Bug). */
  parentId: z.number().int().positive().optional(),
  loggedHours: z.number().optional(),
  estimatedHours: z.number().optional(),
  /** Fecha de trabajo (YYYY-MM-DD), desde el campo configurado en ADO. */
  workingDate: z.string().optional(),
  /** Start Date del PBI/HU (YYYY-MM-DD). */
  startDate: z.string().optional(),
  /** Target Date del PBI/HU (YYYY-MM-DD). */
  targetDate: z.string().optional(),
  responsableMaquetacion: z.string().optional(),
  responsableIntegrador: z.string().optional(),
  responsableQA: z.string().optional(),
  /** Tags de Azure DevOps (`System.Tags`), parseados. */
  tags: z.array(z.string()).optional(),
});

export const adoSprintsResponseSchema = z.object({
  sprints: z.array(adoSprintSchema),
});

export const adoWorkItemsResponseSchema = z.object({
  workItems: z.array(adoWorkItemOptionSchema),
});

export const adoTaskStateSchema = z.object({
  name: z.string(),
  category: z.string(),
});

export const adoTaskStatesResponseSchema = z.object({
  states: z.array(adoTaskStateSchema),
  defaultOpenState: z.string(),
  defaultCompletedState: z.string(),
});

export const adoTeamMemberSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  uniqueName: z.string().optional(),
});

export const adoTeamMembersResponseSchema = z.object({
  members: z.array(adoTeamMemberSchema),
});

export const adoBacklogStatesResponseSchema = z.object({
  states: z.array(adoTaskStateSchema),
  workItemType: z.string(),
});

export type AdoProjectDto = z.infer<typeof adoProjectSchema>;
export type AdoTeamDto = z.infer<typeof adoTeamSchema>;
export type AdoSprintDto = z.infer<typeof adoSprintSchema>;
export type AdoWorkItemOptionDto = z.infer<typeof adoWorkItemOptionSchema>;
export type AdoTaskStateDto = z.infer<typeof adoTaskStateSchema>;
export type AdoTeamMemberDto = z.infer<typeof adoTeamMemberSchema>;
