export type ResponsableFieldConfig = {
  key: string;
  referenceName: string;
  label: string;
  defaultToCurrentUser: boolean;
};

export type ProjectConfigInput = {
  workingDateField?: string | null;
  timezone?: string | null;
  completedWorkField?: string | null;
  originalEstimateField?: string | null;
  activityField?: string | null;
  remainingWorkField?: string | null;
  taskWorkItemType?: string | null;
  bugWorkItemType?: string | null;
  backlogItemType?: string | null;
  taskTodoState?: string | null;
  taskDoneState?: string | null;
  /** Lista de campos Responsable configurados por el admin (orden estable). */
  responsableFields?: readonly ResponsableFieldConfig[];
  configSource: "auto" | "manual";
  discoveredAt?: Date | null;
};

export type ProjectConfigRow = ProjectConfigInput & {
  id: string;
  organization: string;
  project: string;
  updatedAt: Date;
};

export interface ProjectConfigurationRepository {
  findByOrgAndProject(
    organization: string,
    project: string,
  ): Promise<ProjectConfigRow | null>;
  upsert(
    organization: string,
    project: string,
    config: ProjectConfigInput,
  ): Promise<void>;
}