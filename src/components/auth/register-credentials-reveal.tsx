"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ACCOUNT_AUTH_COPY } from "@/components/auth/account-auth-copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RegisterCredentials } from "@/hooks/auth/use-register-pat-form";

export type RegisterCredentialsRevealProps = {
  credentials: RegisterCredentials;
};

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export function RegisterCredentialsReveal({
  credentials,
}: RegisterCredentialsRevealProps) {
  const router = useRouter();
  const copy = ACCOUNT_AUTH_COPY.credentialsReveal;
  const [copiedField, setCopiedField] = useState<"username" | "password" | null>(
    null,
  );

  const handleCopy = useCallback(
    async (field: "username" | "password", value: string) => {
      const ok = await copyText(value);
      if (ok) {
        setCopiedField(field);
        window.setTimeout(() => setCopiedField(null), 2000);
      }
    },
    [],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">{copy.title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {copy.description}
        </p>
      </div>

      <p className="text-muted-foreground text-sm leading-relaxed">
        {credentials.notice}
      </p>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="reveal-username">{copy.usernameLabel}</Label>
          <div className="flex gap-2">
            <Input
              id="reveal-username"
              readOnly
              value={credentials.username}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleCopy("username", credentials.username)}
            >
              {copiedField === "username" ? copy.copied : copy.copyUsername}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="reveal-password">{copy.passwordLabel}</Label>
          <div className="flex gap-2">
            <Input
              id="reveal-password"
              readOnly
              type="password"
              value={credentials.password}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleCopy("password", credentials.password)}
            >
              {copiedField === "password" ? copy.copied : copy.copyPassword}
            </Button>
          </div>
        </div>
      </div>

      <p className="text-destructive text-sm font-medium" role="alert">
        {copy.warning}
      </p>

      <Button
        type="button"
        className="w-full"
        onClick={() => {
          router.push("/");
          router.refresh();
        }}
      >
        {copy.continue}
      </Button>

      <p className="text-center text-sm">
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          {ACCOUNT_AUTH_COPY.register.loginLink}
        </Link>
      </p>
    </div>
  );
}
