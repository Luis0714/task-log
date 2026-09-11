"use client";

import type { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type FiltersBottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
};

export function FiltersBottomSheet({
  open,
  onOpenChange,
  title = "Filtros rápidos",
  children,
}: FiltersBottomSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] gap-0 rounded-t-2xl p-0"
      >
        <div className="bg-muted-foreground/30 mx-auto mt-2 h-1 w-10 rounded-full" aria-hidden />
        <SheetHeader className="border-border flex-row items-center gap-2 border-b px-4 py-3">
          <SlidersHorizontal className="size-4" aria-hidden />
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
