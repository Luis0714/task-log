"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { loginLocal } from "@/services/auth/login-local.service";

export function useLoginLocalForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setErrorMessage(null);

    const result = await loginLocal({ username, password });
    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.errorMessage);
      return;
    }

    router.push("/");
    router.refresh();
  }, [password, router, username]);

  return {
    username,
    password,
    submitting,
    errorMessage,
    setUsername,
    setPassword,
    submit,
  };
}
