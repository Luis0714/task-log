export function resolveCreateTargetBranch(
  names: readonly string[],
  current: string,
): string {
  if (current && names.includes(current)) return current;
  return (
    names.find((name) => name === "develop") ??
    names.find((name) => name === "main") ??
    names.find((name) => name === "master") ??
    names[0] ??
    ""
  );
}

export function resolveCreateSourceBranch(
  names: readonly string[],
  current: string,
  target: string,
): string {
  if (current && names.includes(current)) return current;
  return names.find((name) => name !== target) ?? names[0] ?? "";
}
