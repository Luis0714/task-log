"use client";

import { GitBranchOptionLabel } from "@/components/shared/git-branch-option-label";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import type { GitBranchOption } from "@/lib/git/branch-option";
import { cn } from "@/lib/utils";

export type GitBranchComboboxProps = {
  branches: readonly GitBranchOption[];
  value: string;
  onValueChange: (name: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  id?: string;
  "aria-label": string;
};

export function GitBranchCombobox({
  branches,
  value,
  onValueChange,
  placeholder = "Selecciona una rama",
  searchPlaceholder = "Filtrar ramas",
  emptyMessage = "No hay ramas que coincidan.",
  id,
  "aria-label": ariaLabel,
}: GitBranchComboboxProps) {
  const selected =
    branches.find((branch) => branch.name === value) ??
    (value ? { name: value } : null);
  const items = sortBranchOptions(branches);
  const mine = items.filter((branch) => branch.isMine);
  const rest = items.filter((branch) => !branch.isMine);

  return (
    <Combobox<GitBranchOption, false>
      items={items}
      value={selected}
      itemToStringLabel={(item) => item?.name ?? ""}
      itemToStringValue={(item) => item?.name ?? ""}
      isItemEqualToValue={(item, current) =>
        Boolean(item && current && item.name === current.name)
      }
      onValueChange={(next) => {
        if (next?.name) onValueChange(next.name);
      }}
    >
      <ComboboxTrigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "flex h-8 max-w-full cursor-pointer items-center justify-between gap-1.5 overflow-hidden rounded-md border border-input bg-muted/40 py-0 pr-2 pl-2 text-sm outline-none select-none",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "data-placeholder:text-muted-foreground dark:bg-input/40 dark:hover:bg-input/60",
        )}
      >
        {selected ? (
          <GitBranchOptionLabel option={selected} className="min-w-0 flex-1" />
        ) : (
          <span className="text-muted-foreground truncate">{placeholder}</span>
        )}
      </ComboboxTrigger>

      <ComboboxContent className="min-w-64">
        <ComboboxInput placeholder={searchPlaceholder} showTrigger={false} />
        <ComboboxList>
          {mine.length > 0 ? (
            <ComboboxGroup items={mine}>
              <ComboboxLabel>Míos</ComboboxLabel>
              <ComboboxCollection>
                {(item: GitBranchOption) => (
                  <ComboboxItem key={`mine-${item.name}`} value={item}>
                    <GitBranchOptionLabel option={item} />
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          ) : null}
          {rest.length > 0 ? (
            <ComboboxGroup items={rest}>
              <ComboboxLabel>Todas</ComboboxLabel>
              <ComboboxCollection>
                {(item: GitBranchOption) => (
                  <ComboboxItem key={`all-${item.name}`} value={item}>
                    <GitBranchOptionLabel option={item} />
                  </ComboboxItem>
                )}
              </ComboboxCollection>
            </ComboboxGroup>
          ) : null}
          <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

function sortBranchOptions(branches: readonly GitBranchOption[]): GitBranchOption[] {
  return [...branches].sort((left, right) => {
    if (Boolean(left.isMine) !== Boolean(right.isMine)) {
      return left.isMine ? -1 : 1;
    }
    if (Boolean(left.isDefault) !== Boolean(right.isDefault)) {
      return left.isDefault ? -1 : 1;
    }
    return left.name.localeCompare(right.name, "es");
  });
}
