"use client";

import { createContext, useContext, type ReactNode } from "react";

type AdoWorkItemLinksContextValue = {
  organization: string | null;
};

const AdoWorkItemLinksContext = createContext<AdoWorkItemLinksContextValue>({
  organization: null,
});

export type AdoWorkItemLinksProviderProps = {
  organization: string | null;
  children: ReactNode;
};

export function AdoWorkItemLinksProvider({
  organization,
  children,
}: AdoWorkItemLinksProviderProps) {
  return (
    <AdoWorkItemLinksContext.Provider value={{ organization }}>
      {children}
    </AdoWorkItemLinksContext.Provider>
  );
}

export function useAdoWorkItemLinks() {
  return useContext(AdoWorkItemLinksContext);
}
