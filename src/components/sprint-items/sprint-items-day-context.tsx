"use client";

import {
  createContext,
  useContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";

type SprintItemsDayContextValue = {
  dayKey: string;
  setDayKey: Dispatch<SetStateAction<string>>;
  sprintWorkingDays: SprintWorkingDay[];
  setSprintWorkingDays: (days: SprintWorkingDay[]) => void;
};

const SprintItemsDayContext = createContext<SprintItemsDayContextValue | null>(null);

export type SprintItemsDayProviderProps = {
  dayKey: string;
  setDayKey: Dispatch<SetStateAction<string>>;
  sprintWorkingDays: SprintWorkingDay[];
  setSprintWorkingDays: (days: SprintWorkingDay[]) => void;
  children: ReactNode;
};

export function SprintItemsDayProvider({
  dayKey,
  setDayKey,
  sprintWorkingDays,
  setSprintWorkingDays,
  children,
}: SprintItemsDayProviderProps) {
  return (
    <SprintItemsDayContext.Provider
      value={{ dayKey, setDayKey, sprintWorkingDays, setSprintWorkingDays }}
    >
      {children}
    </SprintItemsDayContext.Provider>
  );
}

export function useSprintItemsDayContext(): SprintItemsDayContextValue | null {
  return useContext(SprintItemsDayContext);
}

export function useSprintItemsDay(): SprintItemsDayContextValue {
  const value = useContext(SprintItemsDayContext);
  if (!value) {
    throw new Error("useSprintItemsDay debe usarse dentro de SprintItemsDayProvider");
  }
  return value;
}
