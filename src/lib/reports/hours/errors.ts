/** Código estable que identifica el motivo del fallo en la respuesta API/UI. */
export const NEWS_NOT_CONFIGURED_CODE = "news_not_configured" as const;

export type HoursReportErrorCode =
  | typeof NEWS_NOT_CONFIGURED_CODE
  | (string & { readonly __brand?: unique symbol });

/** El (proyecto, equipo) solicitado no tiene HU de novedades vinculadas, por
 *  lo que el reporte no puede calcular horas de novedades. El usuario debe
 *  vincular al menos una HU en la pantalla de Novedades. */
export class NewsNotConfiguredError extends Error {
  readonly code = NEWS_NOT_CONFIGURED_CODE;

  constructor(
    message = "El proyecto/equipo que seleccionaste no tiene HU de novedades configuradas, por lo cual no podemos generar el reporte. Vincula al menos una HU en la pantalla de Novedades.",
  ) {
    super(message);
    this.name = "NewsNotConfiguredError";
  }
}