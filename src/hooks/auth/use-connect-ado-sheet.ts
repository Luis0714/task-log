"use client";

import { useCallback, useEffect, useState } from "react";

import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { SessionAuthMethod } from "@/lib/auth/session-auth-method";

export type ConnectSheetStep = "choose" | "detail";

export type UseConnectAdoSheetParams = {
  connectOptions: ConnectAuthOptions;
  open: boolean;
};

export function useConnectAdoSheet({ connectOptions, open }: UseConnectAdoSheetParams) {
  const [step, setStep] = useState<ConnectSheetStep>("choose");
  const [selectedMethod, setSelectedMethod] = useState<SessionAuthMethod | null>(
    null,
  );

  const resetFlow = useCallback(() => {
    setStep("choose");
    setSelectedMethod(null);
  }, []);

  useEffect(() => {
    if (!open) resetFlow();
  }, [open, resetFlow]);

  const selectMethod = useCallback((method: SessionAuthMethod) => {
    setSelectedMethod(method);
    setStep("detail");
  }, []);

  const goBack = useCallback(() => {
    setStep("choose");
    setSelectedMethod(null);
  }, []);

  const availableMethods: SessionAuthMethod[] = [
    ...(connectOptions.oauthEnabled ? (["oauth"] as const) : []),
    ...(connectOptions.patEnabled ? (["pat"] as const) : []),
  ];

  return {
    step,
    selectedMethod,
    availableMethods,
    selectMethod,
    goBack,
    resetFlow,
  };
}
