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
export const DEFAULT_TARGET_BRANCH = "main";
export const PULL_REQUEST_LIST_ERROR =
  "No se pudieron cargar los pull requests de Azure DevOps.";
export const PULL_REQUEST_DETAIL_ERROR =
  "No se pudo cargar el detalle del pull request en Azure DevOps.";
export const PULL_REQUEST_THREADS_ERROR =
  "No se pudieron cargar los comentarios del pull request.";
export const PULL_REQUEST_COMMENT_PLACEHOLDER = "Escribe un comentario…";
export const PULL_REQUEST_REPLY_PLACEHOLDER = "Responder…";
export const PULL_REQUEST_COMMENT_SUBMIT = "Comentar";
export const PULL_REQUEST_REPLY_SUBMIT = "Responder";
export const PULL_REQUEST_COMMENT_SUCCESS = "Comentario publicado";
export const PULL_REQUEST_REPLY_SUCCESS = "Respuesta publicada";
export const PULL_REQUEST_THREAD_STATUS_SUCCESS =
  "Estado del comentario actualizado";
export const PULL_REQUEST_BACK_TO_LIST_LABEL = "Volver al listado";
export const COPY_PR_HELP_MESSAGE_LABEL = "Copiar mensaje para Teams";
export const COPY_PR_HELP_MESSAGE_SUCCESS =
  "Mensaje copiado. Ya lo puedes pegar en Teams.";
export const COPY_PR_HELP_MESSAGE_ERROR = "No se pudo copiar el mensaje.";
