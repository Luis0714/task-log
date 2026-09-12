export const PULL_REQUEST_SEARCH_PLACEHOLDER = "ID o título del pull request";
export const NEW_PULL_REQUEST_LABEL = "Nueva Pull Request";
export const CREATE_PULL_REQUEST_LABEL = "Crear pull request";
export const CREATE_PULL_REQUEST_FAB_LABEL = "Crear PR";
export const CREATE_PULL_REQUEST_PENDING_LABEL = "Creando pull request...";
export const CREATE_PULL_REQUEST_SUCCESS_DESCRIPTION =
  "Ya está publicado en Azure DevOps.";

export function createPullRequestSuccessTitle(pullRequestId: number): string {
  return `Pull request #${pullRequestId} creado`;
}
export const NO_CHANGES_TO_MERGE_MESSAGE =
  "No hay cambios para fusionar entre las ramas seleccionadas.";
export const LARGE_COMMIT_MERGE_MESSAGE =
  "Este pull request fusionará más de 100 commits. Revisa origen y destino para confirmar que es intencional.";
export const DESCRIPTION_MAX_LENGTH = 4000;
