"use client";

import Link from "next/link";

import { ACCOUNT_AUTH_COPY } from "@/components/auth/account-auth-copy";
import { Button } from "@/components/ui/button";

export function ConnectMethodPatAction() {
  return (
    <div className="space-y-3 pt-1">
      <p className="text-muted-foreground text-sm leading-relaxed">
        {ACCOUNT_AUTH_COPY.patConnectHint}
      </p>
      <Button
        className="w-full"
        render={<Link href="/registro" />}
        nativeButton={false}
      >
        {ACCOUNT_AUTH_COPY.patConnectRegister}
      </Button>
      <Button
        variant="outline"
        className="w-full"
        render={<Link href="/login" />}
        nativeButton={false}
      >
        {ACCOUNT_AUTH_COPY.patConnectLogin}
      </Button>
    </div>
  );
}
