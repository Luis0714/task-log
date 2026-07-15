import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Tabla con scroll horizontal y columnas a la izquierda que permanecen fijas
 * durante el scroll. El contenedor provee `overflow-x-auto` con `border-collapse: collapse`
 * para que las celdas adyacentes peguen sin intersticios, y un bg opaco en las sticky
 * que coincide con el color del resto de la tabla para que no haya distinción visual
 * entre columnas fijas y móviles.
 */
export type StickyTableColumn<T> = {
  key: string;
  header: ReactNode;
  widthClass?: string;
  sticky?: { leftClass: string; isLast?: boolean };
  align?: "left" | "center";
  bodyClassName?: string;
  headerClassName?: string;
  render: (row: T) => ReactNode;
};

export type StickyTableProps<T> = {
  columns: readonly StickyTableColumn<T>[];
  rows: readonly T[];
  getRowKey: (row: T, index: number) => string;
  className?: string;
  rowClassName?: string;
  bodyClassName?: string;
};

export function StickyTable<T>({
  columns,
  rows,
  getRowKey,
  className,
  rowClassName,
  bodyClassName,
}: Readonly<StickyTableProps<T>>) {
  return (
    <div className={cn("overflow-x-auto rounded-md border", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            {columns.map((col) => (
              <th key={col.key} className={headerCellClass(col)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={bodyClassName}>
          {rows.map((row, idx) => (
            <tr key={getRowKey(row, idx)} className={rowClassName}>
              {columns.map((col) => (
                <td key={col.key} className={bodyCellClass(col)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function headerCellClass<T>(col: StickyTableColumn<T>): string {
  const alignment = col.align === "center" ? "text-center" : "text-left";
  if (!col.sticky) {
    return cn(
      "bg-background px-3 py-2 font-medium whitespace-nowrap",
      alignment,
      col.widthClass,
      col.headerClassName,
    );
  }
  return cn(
    "sticky z-20 bg-background px-3 py-2 font-medium whitespace-nowrap",
    col.sticky.leftClass,
    col.widthClass,
    alignment,
    col.sticky.isLast &&
      "after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border/60 after:content-['']",
    col.headerClassName,
  );
}

function bodyCellClass<T>(col: StickyTableColumn<T>): string {
  if (!col.sticky) {
    return cn("px-3 py-2", col.widthClass, col.bodyClassName);
  }
  return cn(
    "sticky z-10 bg-background px-3 py-2",
    col.sticky.leftClass,
    col.widthClass,
    col.sticky.isLast &&
      "after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border/60 after:content-['']",
    col.bodyClassName,
  );
}
