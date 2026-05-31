/** Valor interno del Select para representar “sin selección”. */
export const SELECT_CLEAR_VALUE = "__select-clear__";

export function isSelectClearValue(value: string | null | undefined): boolean {
  return !value || value === SELECT_CLEAR_VALUE;
}
