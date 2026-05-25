"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";

type SprintItemsDayContextValue = {
  dayKey: string;
  setDayKey: (value: string) => void;
  sprintWorkingDays: SprintWorkingDay[];
};

const SprintItemsDayContext = createContext<SprintItemsDayContextValue | null>(null);

export type SprintItemsDayProviderProps = {
  dayKey: string;
  setDayKey: (value: string) => void;
  sprintWorkingDays: SprintWorkingDay[];
  children: ReactNode;
};

export function SprintItemsDayProvider({
  dayKey,
  setDayKey,
  sprintWorkingDays,
  children,
}: SprintItemsDayProviderProps) {
  return (
    <SprintItemsDayContext.Provider value={{ dayKey, setDayKey, sprintWorkingDays }}>
      {children}
    </SprintItemsDayContext.Provider>
  );
}

export function useSprintItemsDay(): SprintItemsDayContextValue {
  const value = useContext(SprintItemsDayContext);
  if (!value) {
    throw new Error("useSprintItemsDay debe usarse dentro de SprintItemsDayProvider");
  }
  return value;
}
