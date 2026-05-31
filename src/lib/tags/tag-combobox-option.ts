import type { AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";
import { normalizeWorkItemTag } from "@/lib/work-items/ado-work-item-tags";

export type TagComboboxOption = {
  value: string;
  label: string;
};

export function mapAdoWorkItemTagsToOptions(
  tags: readonly AdoWorkItemTagDto[],
): TagComboboxOption[] {
  return tags.map((tag) => ({
    value: tag.id,
    label: tag.name,
  }));
}

export function mapAdoWorkItemTagsToNameOptions(
  tags: readonly AdoWorkItemTagDto[],
): TagComboboxOption[] {
  return tags.map((tag) => ({
    value: tag.name,
    label: tag.name,
  }));
}

function appendUniqueTagOption(
  options: TagComboboxOption[],
  knownKeys: Set<string>,
  tagName: string,
): void {
  const trimmed = tagName.trim();
  if (!trimmed) return;

  const dedupeKey = normalizeWorkItemTag(trimmed);
  if (knownKeys.has(dedupeKey)) return;

  options.push({ value: trimmed, label: trimmed });
  knownKeys.add(dedupeKey);
}

export function mergeWorkItemTagOptions(
  catalogTags: readonly AdoWorkItemTagDto[],
  selectedTagNames: readonly string[],
): TagComboboxOption[] {
  const options: TagComboboxOption[] = [];
  const knownKeys = new Set<string>();

  for (const tag of catalogTags) {
    appendUniqueTagOption(options, knownKeys, tag.name);
  }

  for (const tagName of selectedTagNames) {
    appendUniqueTagOption(options, knownKeys, tagName);
  }

  return options.sort((left, right) => left.label.localeCompare(right.label, "es"));
}

export function normalizeTagComboboxOption(item: unknown): TagComboboxOption | null {
  if (typeof item === "string") {
    const trimmed = item.trim();
    return trimmed ? { value: trimmed, label: trimmed } : null;
  }

  if (
    item &&
    typeof item === "object" &&
    "value" in item &&
    typeof (item as TagComboboxOption).value === "string"
  ) {
    const option = item as TagComboboxOption;
    const trimmed = option.value.trim();
    if (!trimmed) return null;
    return { value: trimmed, label: option.label?.trim() || trimmed };
  }

  return null;
}

export function coerceTagComboboxSelectedItems(
  selectedValue: TagComboboxOption | TagComboboxOption[] | string | string[] | null | undefined,
): TagComboboxOption[] {
  if (selectedValue == null) return [];

  if (Array.isArray(selectedValue)) {
    return selectedValue.flatMap((item) => {
      const option = normalizeTagComboboxOption(item);
      return option ? [option] : [];
    });
  }

  const option = normalizeTagComboboxOption(selectedValue);
  return option ? [option] : [];
}

export function extractTagComboboxValues(
  nextValue: TagComboboxOption | TagComboboxOption[] | string | string[] | null | undefined,
): string[] {
  return coerceTagComboboxSelectedItems(nextValue).map((option) => option.value);
}

export function resolveTagComboboxSelection(
  options: readonly TagComboboxOption[],
  selectedValues: readonly string[],
): TagComboboxOption[] {
  const optionByValue = new Map(options.map((option) => [option.value, option]));
  return selectedValues
    .map((value) => optionByValue.get(value))
    .filter((option): option is TagComboboxOption => Boolean(option));
}
