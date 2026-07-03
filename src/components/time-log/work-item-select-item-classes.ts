/**
 * Clases del ítem del select de historias.
 * Incluye overrides de las utilities de ComboboxItem (cursor-default, data-highlighted:bg-accent,
 * data-highlighted:**:text-accent-foreground) para que tailwind-merge las resuelva en el cn() del ítem.
 */
export const WORK_ITEM_SELECT_ITEM_CLASS = [
  "work-item-select-item",
  "cursor-pointer",
  "data-highlighted:bg-muted/40",
  "data-highlighted:border-border/60",
  "data-highlighted:text-foreground",
  "not-data-[variant=destructive]:data-highlighted:**:text-inherit",
].join(" ");

/** Contenedor interno del option. */
export const WORK_ITEM_SELECT_OPTION_CLASS = "work-item-select-option";
