"use client";

import { Suspense } from "react";

import { ConnectAuthNotice } from "@/components/auth/connect-auth-notice";
import { useAuthNoticeFromUrl } from "@/hooks/auth/use-auth-notice-from-url";

function LoginAuthNoticeSlot() {
  const authNotice = useAuthNoticeFromUrl();
  if (!authNotice) return null;
  return <ConnectAuthNotice message={authNotice} />;
}

export function LoginAuthNotice() {
  return (
    <Suspense fallback={null}>
      <LoginAuthNoticeSlot />
    </Suspense>
  );
}
