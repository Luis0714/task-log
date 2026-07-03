export const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKeyValid(value: string): boolean {
  return DATE_KEY_PATTERN.test(value);
}
