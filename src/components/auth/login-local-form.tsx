"use client";

import Link from "next/link";

import { ACCOUNT_AUTH_COPY } from "@/components/auth/account-auth-copy";
import { ConnectMethodOauthAction } from "@/components/auth/connect-method-oauth-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginLocalForm } from "@/hooks/auth/use-login-local-form";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";

export type LoginLocalFormProps = {
  connectOptions: ConnectAuthOptions;
};

export function LoginLocalForm({ connectOptions }: LoginLocalFormProps) {
  const copy = ACCOUNT_AUTH_COPY.login;
  const {
    username,
    password,
    submitting,
    errorMessage,
    setUsername,
    setPassword,
    submit,
  } = useLoginLocalForm();

  return (
    <div className="space-y-6">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="login-username">{copy.usernameLabel}</Label>
          <Input
            id="login-username"
            autoComplete="username"
            spellCheck={false}
            placeholder={copy.usernamePlaceholder}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="login-password">{copy.passwordLabel}</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder={copy.passwordPlaceholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {errorMessage ? (
          <p className="text-destructive text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? copy.submitting : copy.submit}
        </Button>
      </form>

      <p className="text-center text-sm">
        {copy.noAccount}{" "}
        <Link
          href="/registro"
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          {copy.registerLink}
        </Link>
      </p>

      {connectOptions.oauthReady ? (
        <div className="space-y-3">
          <p className="text-muted-foreground text-center text-xs uppercase tracking-wide">
            {copy.microsoftDivider}
          </p>
          <ConnectMethodOauthAction />
        </div>
      ) : null}
    </div>
  );
}
