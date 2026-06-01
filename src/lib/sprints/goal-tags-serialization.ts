/** Serializa nombres de tag en el campo texto de BD (compatible con un solo tag legado). */
export function serializeGoalTagNames(tags: readonly string[]): string {
  const normalized = [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))];
  if (normalized.length === 0) return "";
  if (normalized.length === 1) return normalized[0]!;
  return JSON.stringify(normalized);
}

export function parseGoalTagNames(stored: string | null | undefined): string[] {
  const raw = stored?.trim() ?? "";
  if (!raw) return [];

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
          .map((tag) => tag.trim());
      }
    } catch {
      return [raw];
    }
  }

  return [raw];
}
