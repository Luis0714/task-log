"use client";

import { useCallback, useEffect, useState } from "react";

import type { SessionAuthMethod } from "@/lib/auth/session-auth-method";

export type UseConnectAdoSheetParams = {
  open: boolean;
};

export function useConnectAdoSheet({ open }: UseConnectAdoSheetParams) {
  const [selectedMethod, setSelectedMethod] = useState<SessionAuthMethod | null>(null);

  const resetFlow = useCallback(() => {
    setSelectedMethod(null);
  }, []);

  useEffect(() => {
    if (!open) resetFlow();
  }, [open, resetFlow]);

  const selectMethod = useCallback((method: SessionAuthMethod) => {
    setSelectedMethod(method);
  }, []);

  return {
    selectedMethod,
    selectMethod,
    resetFlow,
  };
}
