"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import {
  EMPTY_CONNECT_PAT_VALUES,
  type ConnectPatFormValues,
} from "@/lib/auth/connect-pat.types";
import { connectWithPat } from "@/services/auth/connect-ado.service";

export function useConnectPatForm(onSuccess?: () => void) {
  const router = useRouter();
  const [values, setValues] = useState<ConnectPatFormValues>(EMPTY_CONNECT_PAT_VALUES);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setField = useCallback(
    (field: keyof ConnectPatFormValues, value: string) => {
      setValues((current) => ({ ...current, [field]: value }));
      setErrorMessage(null);
    },
    [],
  );

  const submit = useCallback(async () => {
    setSubmitting(true);
    setErrorMessage(null);

    const result = await connectWithPat(values);

    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.errorMessage);
      return;
    }

    onSuccess?.();
    router.refresh();
  }, [onSuccess, router, values]);

  return {
    values,
    submitting,
    errorMessage,
    setField,
    submit,
  };
}
