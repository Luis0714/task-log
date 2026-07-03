"use client";

import { useId } from "react";
import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DataTableSortOption,
  DataTableSortSpec,
  SortDirection,
} from "@/lib/data-table/data-table-sort";
import { toggleSortDirection } from "@/lib/data-table/data-table-sort";
import { cn } from "@/lib/utils";

export type DataTableSortControlProps<TField extends string> = {
  value: DataTableSortSpec<TField>;
  options: readonly DataTableSortOption<TField>[];
  disabled?: boolean;
  className?: string;
  fieldLabel?: string;
  /** Clases adicionales para el SelectTrigger (p.ej. ancho). Por defecto "w-36". */
  fieldClassName?: string;
  onChange: (value: DataTableSortSpec<TField>) => void;
};

function directionLabel(direction: SortDirection): string {
  return direction === "asc" ? "Ascendente" : "Descendente";
}

export function DataTableSortControl<TField extends string>({
  value,
  options,
  disabled = false,
  className,
  fieldLabel = "Ordenar por",
  fieldClassName = "w-36",
  onChange,
}: DataTableSortControlProps<TField>) {
  const id = useId();
  const fieldId = `${id}-field`;
  const directionId = `${id}-direction`;

  return (
    <div
      className={cn(
        "inline-grid grid-cols-[auto_auto] items-center gap-x-2 gap-y-1.5",
        className,
      )}
    >
      <Label htmlFor={fieldId} className="text-xs">
        {fieldLabel}
      </Label>
      <Label htmlFor={directionId} className="text-xs">
        Orden
      </Label>

      <Select
        value={value.field}
        disabled={disabled || options.length === 0}
        onValueChange={(nextField) => {
          if (!nextField) return;
          onChange({ field: nextField as TField, direction: value.direction });
        }}
      >
        <SelectTrigger id={fieldId} className={fieldClassName}>
          <SelectValue placeholder="Campo">
            {(fieldValue: TField | null) => {
              if (!fieldValue) return null;
              return options.find((option) => option.value === fieldValue)?.label ?? fieldValue;
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        id={directionId}
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        className="h-8 shrink-0 gap-1.5"
        title={directionLabel(value.direction)}
        onClick={() =>
          onChange({ field: value.field, direction: toggleSortDirection(value.direction) })
        }
      >
        {value.direction === "asc" ? (
          <ArrowDownAZ className="size-4" aria-hidden />
        ) : (
          <ArrowUpAZ className="size-4" aria-hidden />
        )}
        <span className="text-xs">{value.direction === "asc" ? "Asc" : "Desc"}</span>
      </Button>
    </div>
  );
}
