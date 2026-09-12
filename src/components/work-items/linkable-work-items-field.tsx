"use client";

import { useMemo, useState } from "react";

import { Combobox } from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { LinkableWorkItemsHeader } from "@/components/work-items/linkable-work-items-header";
import { LinkableWorkItemsPopup } from "@/components/work-items/linkable-work-items-popup";
import { LinkableWorkItemsSelectedList } from "@/components/work-items/linkable-work-items-selected-list";
import { LinkableWorkItemsTrigger } from "@/components/work-items/linkable-work-items-trigger";
import type { LinkableWorkItemDto } from "@/lib/work-items/linkable-work-item";
import {
  filterLinkableWorkItems,
  linkableWorkItemSearchLabel,
} from "@/lib/work-items/linkable-work-item-options";
import { resolveRememberedWorkItems } from "@/lib/work-items/remember-linkable-work-items";

function emptyLinkableWorkItemsMessage(query: string, includeBacklog: boolean): string {
  if (query.trim()) return "No hay coincidencias.";
  if (includeBacklog) return "No hay HUs, bugs o tareas en el backlog.";
  return "No hay HUs, bugs o tareas en el sprint actual.";
}

export type LinkableWorkItemsFieldProps = Readonly<{
  items: readonly LinkableWorkItemDto[];
  value: readonly string[];
  includeBacklog: boolean;
  loading?: boolean;
  error?: string | null;
  onChange: (value: string[]) => void;
  onIncludeBacklogChange: (checked: boolean) => void;
}>;

export function LinkableWorkItemsField({
  items,
  value,
  includeBacklog,
  loading = false,
  error = null,
  onChange,
  onIncludeBacklogChange,
}: LinkableWorkItemsFieldProps) {
  const [knownSelected, setKnownSelected] = useState<LinkableWorkItemDto[]>([]);
  const [query, setQuery] = useState("");
  const selectedItems = useMemo(
    () => resolveRememberedWorkItems(knownSelected, items, value),
    [knownSelected, items, value],
  );
  const availableItems = useMemo(
    () => items.filter((item) => !value.includes(String(item.id))),
    [items, value],
  );
  const visibleItems = useMemo(
    () => filterLinkableWorkItems(availableItems, query),
    [availableItems, query],
  );
  const emptyMessage = emptyLinkableWorkItemsMessage(query, includeBacklog);

  function handleSelect(item: LinkableWorkItemDto | null) {
    if (!item) return;
    setKnownSelected((current) =>
      current.some((entry) => entry.id === item.id) ? current : [...current, item],
    );
    onChange([...value, String(item.id)]);
    setQuery("");
  }

  function handleRemove(id: number) {
    setKnownSelected((current) => current.filter((item) => item.id !== id));
    onChange(value.filter((itemId) => itemId !== String(id)));
  }

  function handleClear() {
    setKnownSelected([]);
    onChange([]);
  }

  return (
    <div className="space-y-1">
      <LinkableWorkItemsHeader
        selectedCount={selectedItems.length}
        includeBacklog={includeBacklog}
        onIncludeBacklogChange={onIncludeBacklogChange}
        onClear={handleClear}
      />

      {loading && items.length === 0 ? (
        <Skeleton className="h-8 w-full" />
      ) : (
        <Combobox<LinkableWorkItemDto, false>
          items={visibleItems}
          value={null}
          inputValue={query}
          disabled={Boolean(error)}
          itemToStringLabel={linkableWorkItemSearchLabel}
          itemToStringValue={(item) => String(item.id)}
          isItemEqualToValue={(item, current) => item.id === current.id}
          onInputValueChange={setQuery}
          onOpenChange={(open) => {
            if (!open) setQuery("");
          }}
          onValueChange={handleSelect}
        >
          <LinkableWorkItemsTrigger
            id="linkable-work-items"
            placeholder="Buscar por ID o título…"
            disabled={Boolean(error)}
          />
          <LinkableWorkItemsPopup
            items={visibleItems}
            searchPlaceholder="Buscar"
            emptyMessage={emptyMessage}
          />
        </Combobox>
      )}

      <LinkableWorkItemsSelectedList items={selectedItems} onRemove={handleRemove} />
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  );
}
