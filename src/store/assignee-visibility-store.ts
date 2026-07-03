"use client";

import { create } from "zustand";

type AssigneeVisibilityState = {
  hidden: ReadonlySet<string>;
  toggle: (assignee: string) => void;
  setHidden: (next: ReadonlySet<string>) => void;
  reset: () => void;
};

export const useAssigneeVisibilityStore = create<AssigneeVisibilityState>()(
  (set) => ({
    hidden: new Set<string>(),

    toggle: (assignee) =>
      set((state) => {
        const next = new Set(state.hidden);
        if (next.has(assignee)) {
          next.delete(assignee);
        } else {
          next.add(assignee);
        }
        return { hidden: next };
      }),

    setHidden: (next) => set({ hidden: next }),

    reset: () => set({ hidden: new Set() }),
  }),
);
