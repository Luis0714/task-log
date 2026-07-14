const ADO_TAG_SEPARATOR = ";";

export function parseAdoWorkItemTags(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(ADO_TAG_SEPARATOR)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function serializeAdoWorkItemTags(tags: readonly string[]): string {
  return tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(`${ADO_TAG_SEPARATOR} `);
}

export function normalizeWorkItemTag(tag: string): string {
  return tag.trim().toLocaleUpperCase("es");
}

export function workItemHasTag(tags: readonly string[], target: string): boolean {
  const normalizedTarget = normalizeWorkItemTag(target);
  return tags.some((tag) => normalizeWorkItemTag(tag) === normalizedTarget);
}

export function areWorkItemTagsEqual(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.length !== right.length) return false;

  const normalizedLeft = left.map(normalizeWorkItemTag).sort((a, b) => a.localeCompare(b));
  const normalizedRight = right.map(normalizeWorkItemTag).sort((a, b) => a.localeCompare(b));

  return normalizedLeft.every((tag, index) => tag === normalizedRight[index]);
}

export function mergeWorkflowTags(
  existingTags: readonly string[],
  workflowTagValues: readonly string[],
  selectedWorkflowTag: string | null,
): string[] {
  const workflowNormalized = new Set(workflowTagValues.map(normalizeWorkItemTag));
  const preserved = existingTags.filter(
    (tag) => !workflowNormalized.has(normalizeWorkItemTag(tag)),
  );

  if (selectedWorkflowTag?.trim()) {
    preserved.push(selectedWorkflowTag.trim());
  }

  return preserved;
}
