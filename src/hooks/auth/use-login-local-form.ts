"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { loginLocal } from "@/services/auth/login-local.service";
import { completeAuthSession } from "@/lib/auth/complete-auth-session";

export type UseLoginLocalFormOptions = {
  onSuccess?: () => void;
  onUserNotFound?: () => void;
};

export function useLoginLocalForm(options?: UseLoginLocalFormOptions) {
  const router = useRouter();
  const onSuccess = options?.onSuccess;
  const onUserNotFound = options?.onUserNotFound;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setErrorMessage(null);

    const result = await loginLocal({ email, password });
    setSubmitting(false);

    if (!result.ok) {
      if (result.reason === "user_not_found") {
        if (onUserNotFound) {
          onUserNotFound();
        } else {
          router.push("/registro");
        }
        return;
      }

      setErrorMessage(result.errorMessage);
      return;
    }

    completeAuthSession(router);
    onSuccess?.();
  }, [email, onSuccess, onUserNotFound, password, router]);

  return {
    email,
    password,
    submitting,
    errorMessage,
    setEmail,
    setPassword,
    submit,
  };
}
