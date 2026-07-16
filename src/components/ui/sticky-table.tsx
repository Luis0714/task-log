"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StickyTableColumnSticky = {
  /** Fija la columna a la izquierda (ej. "left-0", "left-48"). */
  leftClass?: string;
  /** Fija la columna a la derecha (ej. "right-0", "right-28"). */
  rightClass?: string;
  /** Columna del grupo fijo que linda con el área con scroll: pinta el divisor. */
  isLast?: boolean;
};

export type StickyTableColumn<T> = {
  key: string;
  header: ReactNode;
  widthClass?: string;
  sticky?: StickyTableColumnSticky;
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
  tableStyle?: CSSProperties;
  rowClassName?: string | ((row: T, index: number) => string);
  bodyClassName?: string;
  renderCard?: (row: T) => ReactNode;
  cardsClassName?: string;
  bodyMaxHeightClass?: string;
};

const DEFAULT_BODY_MAX_HEIGHT = "max-h-[60vh]";

export function StickyTable<T>({
  columns,
  rows,
  getRowKey,
  className,
  tableClassName,
  tableStyle,
  rowClassName,
  bodyClassName,
  renderCard,
  cardsClassName,
  bodyMaxHeightClass = DEFAULT_BODY_MAX_HEIGHT,
}: Readonly<StickyTableProps<T>>) {
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const headerEl = headerScrollRef.current;
    const bodyEl = bodyScrollRef.current;
    if (!headerEl || !bodyEl) return;

    let syncing = false;
    const syncFromHeader = () => {
      if (syncing) return;
      syncing = true;
      bodyEl.scrollLeft = headerEl.scrollLeft;
      requestAnimationFrame(() => {
        syncing = false;
      });
    };
    const syncFromBody = () => {
      if (syncing) return;
      syncing = true;
      headerEl.scrollLeft = bodyEl.scrollLeft;
      requestAnimationFrame(() => {
        syncing = false;
      });
    };

    headerEl.addEventListener("scroll", syncFromHeader, { passive: true });
    bodyEl.addEventListener("scroll", syncFromBody, { passive: true });

    return () => {
      headerEl.removeEventListener("scroll", syncFromHeader);
      bodyEl.removeEventListener("scroll", syncFromBody);
    };
  }, []);

  const sharedTableClasses = cn(
    "w-full table-fixed border-separate border-spacing-0 bg-background text-sm",
    tableClassName,
  );

  const resolveRowClassName = (row: T, index: number): string | undefined =>
    typeof rowClassName === "function" ? rowClassName(row, index) : rowClassName;

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
      <div
        className={cn(
          "bg-background hidden overflow-hidden rounded-md border md:block",
          className,
        )}
      >
        <div ref={headerScrollRef} className="overflow-x-auto">
          <table className={sharedTableClasses} style={tableStyle}>
            <thead>
              <tr className="border-b">
                {columns.map((col) => (
                  <th key={col.key} className={headerCellClass(col)}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
        <div
          ref={bodyScrollRef}
          className={cn(
            bodyMaxHeightClass,
            "scrollbar-none [&::-webkit-scrollbar]:hidden",
            "overflow-x-auto overflow-y-auto",
          )}
        >
          <table className={sharedTableClasses} style={tableStyle}>
            <tbody className={bodyClassName}>
              {rows.map((row, idx) => (
                <tr key={getRowKey(row, idx)} className={resolveRowClassName(row, idx)}>
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
      </div>
    </>
  );
}

function stickyEdgeClass(sticky: StickyTableColumnSticky): string | false {
  if (!sticky.isLast) return false;
  if (sticky.rightClass) {
    return "after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-border/60 after:content-['']";
  }
  return "after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border/60 after:content-['']";
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
    col.sticky.rightClass,
    col.widthClass,
    alignment,
    stickyEdgeClass(col.sticky),
    col.headerClassName,
  );
}

function bodyCellClass<T>(col: StickyTableColumn<T>): string {
  if (!col.sticky) {
    return cn(
      "border-b border-border/60 px-3 py-2",
      col.widthClass,
      col.bodyClassName,
    );
  }
  return cn(
    "sticky z-10 border-b border-border/60 bg-background px-3 py-2",
    col.sticky.leftClass,
    col.sticky.rightClass,
    col.widthClass,
    stickyEdgeClass(col.sticky),
    col.bodyClassName,
  );
}
