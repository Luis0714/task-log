/**
 * Roles legacy de Responsable, mantenidos por retro-compatibilidad con código
 * que asume tres roles fijos (maquetacion/integrador/qa). Para campos nuevos
 * discovered, usa el `referenceName` del proceso como `key`.
 */
export type BacklogResponsableFieldKey = "maquetacion" | "integrador" | "qa";

export type BacklogResponsableFieldDto = {
  /** Identificador estable. Para roles legacy, uno de `BacklogResponsableFieldKey`. Para campos discovered/configurados, el `referenceName`. */
  key: string;
  referenceName: string;
  label: string;
  defaultToCurrentUser: boolean;
  source: "env" | "discovered" | "manual";
  envKey: string | null;
};