export type SprintShareScope = {
  project: string;
  team: string;
  sprintPath: string;
  sprintName: string;
  sprintStartDate?: string;
  sprintFinishDate?: string;
};

export function normalizeSprintShareScope(scope: SprintShareScope): SprintShareScope {
  return {
    project: scope.project.trim(),
    team: scope.team.trim(),
    sprintPath: scope.sprintPath.trim(),
    sprintName: scope.sprintName.trim(),
    sprintStartDate: scope.sprintStartDate?.trim(),
    sprintFinishDate: scope.sprintFinishDate?.trim(),
  };
}

export function appendSprintShareScopeParams(
  params: URLSearchParams,
  scope: SprintShareScope,
): URLSearchParams {
  const normalized = normalizeSprintShareScope(scope);

  params.set("project", normalized.project);
  params.set("team", normalized.team);
  params.set("sprintPath", normalized.sprintPath);
  params.set("sprintName", normalized.sprintName);

  if (normalized.sprintStartDate) {
    params.set("sprintStartDate", normalized.sprintStartDate);
  }

  if (normalized.sprintFinishDate) {
    params.set("sprintFinishDate", normalized.sprintFinishDate);
  }

  return params;
}
