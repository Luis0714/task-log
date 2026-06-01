export type SprintTimesShareVariant = "full" | "week1" | "week2";

export const SPRINT_TIMES_SHARE_VARIANT_ITEMS = [
  { value: "full" as const, label: "Completo" },
  { value: "week1" as const, label: "Semana 1" },
  { value: "week2" as const, label: "Semana 2" },
] as const;

export function getSprintTimesShareVariantLabel(variant: SprintTimesShareVariant): string {
  const item = SPRINT_TIMES_SHARE_VARIANT_ITEMS.find((entry) => entry.value === variant);
  return item?.label ?? variant;
}
