"use client";

import { useRouter } from "next/navigation";

import { LoginLocalForm } from "@/components/auth/login-local-form";
import { LoginOAuthForm } from "@/components/auth/login-oauth-form";
import { isPatAuthHidden } from "@/lib/auth/auth-method";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";

export type ConnectSignInPanelProps = {
  connectOptions: ConnectAuthOptions;
  onConnected: () => void;
};

export function ConnectSignInPanel({
  connectOptions,
  onConnected,
}: ConnectSignInPanelProps) {
  const router = useRouter();

  if (!connectOptions.persistenceReady) {
    return (
      <p className="text-muted-foreground text-sm leading-relaxed">
        {USER_MESSAGES.persistenceUnavailable}
      </p>
    );
  }

  if (isPatAuthHidden()) {
    return <LoginOAuthForm />;
  }

  return (
    <LoginLocalForm
      connectOptions={connectOptions}
      idPrefix="sheet-login"
      onSuccess={onConnected}
      onUserNotFound={() => {
        onConnected();
        router.push("/registro");
      }}
    />
  );
}
