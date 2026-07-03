"use client";

import { useCallback, useState } from "react";

export type AssigneeVisibility = {
  hidden: ReadonlySet<string>;
  isHidden: (assignee: string) => boolean;
  toggle: (assignee: string) => void;
  setHidden: (next: ReadonlySet<string>) => void;
  reset: () => void;
};

export function useAssigneeVisibility(): AssigneeVisibility {
  const [hidden, setHiddenState] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );

  const isHidden = useCallback(
    (assignee: string) => hidden.has(assignee),
    [hidden],
  );

  const toggle = useCallback((assignee: string) => {
    setHiddenState((current) => {
      const next = new Set(current);
      if (next.has(assignee)) {
        next.delete(assignee);
      } else {
        next.add(assignee);
      }
      return next;
    });
  }, []);

  const setHidden = useCallback((next: ReadonlySet<string>) => {
    setHiddenState(next);
  }, []);

  const reset = useCallback(() => {
    setHiddenState(new Set());
  }, []);

  return { hidden, isHidden, toggle, setHidden, reset };
}
