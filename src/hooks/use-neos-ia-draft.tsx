"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

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
  // textareaRef needs to survive re-renders. We use a lazy module-scope ref
  // that the consumer sets via registerTextarea. The provider doesn't need to
  // store it; we just expose the focusTextarea callback.
  // Using module-scope keeps the provider's render stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const textareaRefHolder = useMemo(() => ({ current: null as HTMLTextAreaElement | null }), []);

  const api = useMemo<NeosIaDraftContextValue>(
    () => ({
      value,
      setValue,
      focusTextarea: () => {
        const node = textareaRefHolder.current;
        if (node) {
          node.focus();
          // Move caret to end of value so the user can keep typing.
          const len = node.value.length;
          node.setSelectionRange(len, len);
        }
      },
      registerTextarea: (node: HTMLTextAreaElement | null) => {
        textareaRefHolder.current = node;
      },
    }),
    [value, setValue, textareaRefHolder],
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
