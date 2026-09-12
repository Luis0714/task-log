export const RELEASE_SEARCH_PLACEHOLDER = "Nombre, ambiente o rama";
export const RELEASE_DEFINITION_PLACEHOLDER = "Definición";
export const RELEASE_LIST_ERROR =
  "No se pudieron cargar los releases de Azure DevOps.";
export const RELEASE_EMPTY_TITLE = "No hay releases";
export const RELEASE_EMPTY_FILTERED_TITLE = "Ningún release coincide";
export const RELEASE_EMPTY_DESCRIPTION =
  "Cuando existan releases en Azure DevOps, aparecerán aquí.";
export const RELEASE_EMPTY_FILTERED_DESCRIPTION =
  "Prueba a cambiar la búsqueda o los filtros.";
export const RELEASE_APPROVE_TITLE = "Aprobar ambiente";
export const RELEASE_APPROVE_CONFIRM = "Aprobar despliegue";
export const RELEASE_APPROVE_DESCRIPTION = (environment: string) =>
  `¿Deseas aprobar el despliegue de este release en ${environment}? Esta acción quedará registrada en Azure DevOps.`;
export const RELEASE_APPROVE_SUCCESS = (environment: string) =>
  `Despliegue en ${environment} aprobado`;
export const RELEASE_APPROVE_SUCCESS_DESCRIPTION =
  "Quedó registrado en Azure DevOps.";
export const RELEASE_FILTERS_TITLE = "Filtros";
export const RELEASE_FILTER_ANY_PERSON = "Cualquiera";
export const RELEASE_FILTER_ANY_BRANCH = "Cualquier rama";
export const RELEASE_FILTER_ANY_ENVIRONMENT = "Cualquier ambiente";
export const RELEASE_FILTER_ANY_STATUS = "Cualquier estado";
