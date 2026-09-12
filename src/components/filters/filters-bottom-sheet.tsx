"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

import { PopupPortalContainerProvider } from "@/components/ui/popup-portal-container-provider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type FiltersBottomSheetProps = Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
}>;

export function FiltersBottomSheet({
  open,
  onOpenChange,
  title = "Filtros rápidos",
  children,
}: FiltersBottomSheetProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={setPortalContainer}
        side="bottom"
        className="max-h-[85dvh] gap-0 overflow-visible rounded-t-2xl p-0"
      >
        <PopupPortalContainerProvider container={portalContainer}>
          <div className="bg-muted-foreground/30 mx-auto mt-2 h-1 w-10 rounded-full" aria-hidden />
          <SheetHeader className="border-border flex-row items-center gap-2 border-b px-4 py-3">
            <SlidersHorizontal className="size-4" aria-hidden />
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        </PopupPortalContainerProvider>
      </SheetContent>
    </Sheet>
  );
}
