"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { EMPTY_CONNECT_PAT_VALUES } from "@/lib/auth/connect-pat.types";
import { connectWithPat } from "@/services/auth/connect-ado.service";

export function useConnectPatForm(onSuccess?: () => void) {
  const router = useRouter();
  const [pat, setPat] = useState(EMPTY_CONNECT_PAT_VALUES.pat);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setPatValue = useCallback((value: string) => {
    setPat(value);
    setErrorMessage(null);
  }, []);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setErrorMessage(null);

    const result = await connectWithPat({ pat });

    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.errorMessage);
      return;
    }

    onSuccess?.();
    router.refresh();
  }, [onSuccess, pat, router]);

  return {
    pat,
    submitting,
    errorMessage,
    setPat: setPatValue,
    submit,
  };
}
