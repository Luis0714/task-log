"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { completeAuthSession } from "@/lib/auth/complete-auth-session";
import { loginSuperAdmin } from "@/services/auth/login-super-admin.service";

export function useSuperAdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setErrorMessage(null);

    const result = await loginSuperAdmin({ password });
    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.errorMessage);
      return;
    }

    completeAuthSession(router, result.landing ?? "/");
  }, [password, router]);

  return {
    password,
    submitting,
    errorMessage,
    setPassword,
    submit,
  };
}
