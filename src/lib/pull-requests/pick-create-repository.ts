export function pickCreateRepository(
  queryRepository: string,
  defaultRepository: string | null,
  repositories: readonly string[],
): string {
  if (queryRepository) return queryRepository;
  if (defaultRepository && repositories.includes(defaultRepository)) {
    return defaultRepository;
  }
  return repositories[0] ?? "";
}
