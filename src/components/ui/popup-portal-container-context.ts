"use client";

import { createContext, useContext } from "react";

export const PopupPortalContainerContext = createContext<HTMLElement | null>(null);

export function usePopupPortalContainer() {
  return useContext(PopupPortalContainerContext);
}
