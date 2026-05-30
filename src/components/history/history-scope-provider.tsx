"use client";

import { createContext, useContext } from "react";

const HistoryScopeContext = createContext<string | null>(null);

export type HistoryScopeProviderProps = {
  scopeKey: string | null;
  children: React.ReactNode;
};

export function HistoryScopeProvider({ scopeKey, children }: HistoryScopeProviderProps) {
  return (
    <HistoryScopeContext.Provider value={scopeKey}>{children}</HistoryScopeContext.Provider>
  );
}

export function useHistoryScopeKey(): string | null {
  return useContext(HistoryScopeContext);
}
