"use client";

import { useCallback, useEffect, useState } from "react";

import { canContinueWithMethod } from "@/lib/auth/connect-method-availability";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { SessionAuthMethod } from "@/lib/auth/session-auth-method";

export type ConnectSheetStep = "choose" | "detail";

export type UseConnectAdoSheetParams = {
  connectOptions: ConnectAuthOptions;
  open: boolean;
};

export function useConnectAdoSheet({ connectOptions, open }: UseConnectAdoSheetParams) {
  const [step, setStep] = useState<ConnectSheetStep>("choose");
  const [selectedMethod, setSelectedMethod] = useState<SessionAuthMethod | null>(null);

  const resetFlow = useCallback(() => {
    setStep("choose");
    setSelectedMethod(null);
  }, []);

  useEffect(() => {
    if (!open) resetFlow();
  }, [open, resetFlow]);

  const selectMethod = useCallback((method: SessionAuthMethod) => {
    setSelectedMethod(method);
  }, []);

  const continueToDetail = useCallback(() => {
    if (!canContinueWithMethod(selectedMethod, connectOptions)) return;
    setStep("detail");
  }, [connectOptions, selectedMethod]);

  const goBack = useCallback(() => {
    setStep("choose");
  }, []);

  const canContinue = canContinueWithMethod(selectedMethod, connectOptions);

  return {
    step,
    selectedMethod,
    selectMethod,
    continueToDetail,
    goBack,
    resetFlow,
    canContinue,
  };
}
