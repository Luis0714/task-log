"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";

export type NeosIaDraftContextValue = {
  value: string;
  setValue: (next: string) => void;
  /** Imperative focus — called by chips after pre-filling the value. */
  focusTextarea: () => void;
  /** Register the textarea ref so chips can focus it. */
  registerTextarea: (node: HTMLTextAreaElement | null) => void;
};

const NeosIaDraftContext = createContext<NeosIaDraftContextValue | null>(null);

export type NeosIaDraftProviderProps = {
  value: string;
  setValue: (next: string) => void;
  children: ReactNode;
};

export function NeosIaDraftProvider({
  value,
  setValue,
  children,
}: Readonly<NeosIaDraftProviderProps>) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const api = useMemo<NeosIaDraftContextValue>(
    () => ({
      value,
      setValue,
      focusTextarea: () => {
        const node = textareaRef.current;
        if (node) {
          node.focus();
          // Move caret to end of value so the user can keep typing.
          const len = node.value.length;
          node.setSelectionRange(len, len);
        }
      },
      registerTextarea: (node: HTMLTextAreaElement | null) => {
        textareaRef.current = node;
      },
    }),
    [value, setValue],
  );

  return (
    <NeosIaDraftContext.Provider value={api}>
      {children}
    </NeosIaDraftContext.Provider>
  );
}

export function useNeosIaDraft(): NeosIaDraftContextValue {
  const ctx = useContext(NeosIaDraftContext);
  if (!ctx) {
    throw new Error("useNeosIaDraft must be used within a NeosIaDraftProvider");
  }
  return ctx;
}
