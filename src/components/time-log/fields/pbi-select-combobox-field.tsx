"use client";

import {
  WorkItemSelectOption,
} from "@/components/time-log/work-item-select-option";
import {
  WORK_ITEM_SELECT_ITEM_CLASS,
} from "@/components/time-log/work-item-select-item-classes";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { cn } from "@/lib/utils";

export type PbiSelectComboboxFieldProps = {
  pbis: readonly AdoWorkItemOptionDto[];
  value: string | null;
  onValueChange: (pbiId: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  id?: string;
};

/**
 * Combobox buscable para seleccionar una historia de usuario en `/time-log`.
 *
 * Inspirado en el patrón de `TagsCombobox`: al abrir el popup aparece un
 * campo de búsqueda que filtra la lista por título o ID. El trigger muestra
 * la PBI seleccionada con la misma presentación que el Select anterior.
 */
export function PbiSelectComboboxField({
  pbis,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Selecciona una historia de usuario",
  searchPlaceholder = "Buscar por título o ID…",
  emptyMessage = "Sin historias que coincidan.",
  id,
}: PbiSelectComboboxFieldProps) {
  const selectedPbi =
    pbis.find((item) => String(item.id) === value) ?? null;
  const itemsForCombobox: AdoWorkItemOptionDto[] = [...pbis];

  return (
    <Combobox<AdoWorkItemOptionDto, false>
      items={itemsForCombobox}
      value={selectedPbi}
      disabled={disabled}
      itemToStringLabel={(item) =>
        item ? `#${item.id} ${item.title}` : ""
      }
      itemToStringValue={(item) => (item ? String(item.id) : "")}
      isItemEqualToValue={(item, current) =>
        item != null && current != null && String(item.id) === String(current.id)
      }
      onValueChange={(nextValue) => {
        onValueChange(nextValue ? String(nextValue.id) : null);
      }}
    >
      <ComboboxTrigger
        id={id}
        disabled={disabled}
        className={cn(
          "flex h-auto min-h-8 w-full max-w-full cursor-pointer items-center justify-between gap-1.5 overflow-hidden rounded-lg border border-input bg-transparent py-1.5 pr-2 pl-2.5 text-sm transition-colors outline-none select-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-placeholder:text-muted-foreground",
          "dark:bg-input/30 dark:hover:bg-input/50",
        )}
      >
        {selectedPbi ? (
          <WorkItemSelectOption item={selectedPbi} variant="trigger" />
        ) : (
          <span className="min-w-0 flex-1 truncate text-left">
            {placeholder}
          </span>
        )}
      </ComboboxTrigger>

      <ComboboxContent>
        <ComboboxInput
          placeholder={searchPlaceholder}
          showTrigger={false}
        />
        <ComboboxList>
          <ComboboxCollection>
            {(item: AdoWorkItemOptionDto) => (
              <ComboboxItem
                key={item.id}
                value={item}
                className={cn(WORK_ITEM_SELECT_ITEM_CLASS, "py-1.5")}
              >
                <WorkItemSelectOption item={item} variant="select" />
              </ComboboxItem>
            )}
          </ComboboxCollection>
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}