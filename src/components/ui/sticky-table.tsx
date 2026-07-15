import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

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
  tableClassName?: string;
  rowClassName?: string;
  bodyClassName?: string;
  renderCard?: (row: T) => ReactNode;
  cardsClassName?: string;
};

export function StickyTable<T>({
  columns,
  rows,
  getRowKey,
  className,
  tableClassName,
  rowClassName,
  bodyClassName,
  renderCard,
  cardsClassName,
}: Readonly<StickyTableProps<T>>) {
  return (
    <>
      {renderCard ? (
        <ul className={cn("flex flex-col gap-2 md:hidden", cardsClassName)}>
          {rows.map((row, idx) => (
            <li
              key={getRowKey(row, idx)}
              className="bg-card text-card-foreground rounded-lg border p-3"
            >
              {renderCard(row)}
            </li>
          ))}
        </ul>
      ) : null}
      <div className={cn("hidden overflow-x-auto rounded-md border md:block", className)}>
        <table
          className={cn(
            "table-fixed border-separate border-spacing-0 bg-background text-sm",
            tableClassName,
          )}
        >
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
    </>
  );
}

function headerCellClass<T>(col: StickyTableColumn<T>): string {
  const alignment = col.align === "center" ? "text-center" : "text-left";
  if (!col.sticky) {
    return cn(
      "border-b border-border/60 bg-background px-3 py-2 font-medium whitespace-nowrap",
      alignment,
      col.widthClass,
      col.headerClassName,
    );
  }
  return cn(
    "sticky z-20 border-b border-border/60 bg-background px-3 py-2 font-medium whitespace-nowrap",
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
    return cn("border-b border-border/60 px-3 py-2", col.widthClass, col.bodyClassName);
  }
  return cn(
    "sticky z-10 border-b border-border/60 bg-background px-3 py-2",
    col.sticky.leftClass,
    col.widthClass,
    col.sticky.isLast &&
      "after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border/60 after:content-['']",
    col.bodyClassName,
  );
}
