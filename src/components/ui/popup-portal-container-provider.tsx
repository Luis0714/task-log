"use client";

import type { ReactNode } from "react";

import { PopupPortalContainerContext } from "@/components/ui/popup-portal-container-context";

export function PopupPortalContainerProvider({
  container,
  children,
}: {
  container: HTMLElement | null;
  children: ReactNode;
}) {
  return (
    <PopupPortalContainerContext.Provider value={container}>
      {children}
    </PopupPortalContainerContext.Provider>
  );
}
