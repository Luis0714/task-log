/** Estado de una HU vinculada al compararla contra Azure DevOps. */
export type NewsStoryValidationStatus = "active" | "deleted" | "renamed";

/**
 * Resultado de validar una HU vinculada:
 * - `active`  → existe en Azure y el título no cambió.
 * - `renamed` → existe pero el título actual difiere del snapshot persistido.
 * - `deleted` → Azure no la devolvió (probablemente eliminada).
 */
export type NewsStoryValidationEntry = Readonly<{
  id: string;
  workItemId: number;
  status: NewsStoryValidationStatus;
  snapshotTitle: string | null;
  currentTitle: string | null;
  currentState: string | null;
}>;

export type NewsStoriesValidationResponse = Readonly<{
  entries: NewsStoryValidationEntry[];
}>;