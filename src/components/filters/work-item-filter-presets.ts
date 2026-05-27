import type { MultiCheckboxFilterPreset } from "@/components/filters/multi-checkbox-filter";

export function allWorkItemStatesPreset(
  selectedStates: readonly string[],
  onSelectAll: () => void,
): MultiCheckboxFilterPreset {
  return {
    label: "Todos los estados",
    active: selectedStates.length === 0,
    onSelect: onSelectAll,
  };
}
