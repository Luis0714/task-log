"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { useConnectPatFields } from "@/hooks/auth/use-connect-pat-fields";
import { registerLocalPat } from "@/services/auth/register-local.service";

export function useRegisterPatForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    pat,
    organization,
    project,
    team,
    adoUrl,
    urlParseError,
    setPat,
    setOrganization,
    setProject,
    setTeam,
    setAdoUrl,
    clearPatFieldErrors,
    buildPatPayload,
  } = useConnectPatFields();

  const clearErrors = useCallback(() => {
    setErrorMessage(null);
    clearPatFieldErrors();
  }, [clearPatFieldErrors]);

  const setEmailValue = useCallback(
    (value: string) => {
      setEmail(value);
      clearErrors();
    },
    [clearErrors],
  );

  const setPasswordValue = useCallback(
    (value: string) => {
      setPassword(value);
      clearErrors();
    },
    [clearErrors],
  );

  const submit = useCallback(async () => {
    setSubmitting(true);
    clearErrors();

    const result = await registerLocalPat({
      email,
      password,
      ...buildPatPayload(),
    });

    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.errorMessage);
      return;
    }

    router.push("/");
    router.refresh();
  }, [buildPatPayload, clearErrors, email, password, router]);

  return {
    email,
    password,
    pat,
    organization,
    project,
    team,
    adoUrl,
    urlParseError,
    submitting,
    errorMessage,
    setEmail: setEmailValue,
    setPassword: setPasswordValue,
    setPat,
    setOrganization,
    setProject,
    setTeam,
    setAdoUrl,
    submit,
  };
}
