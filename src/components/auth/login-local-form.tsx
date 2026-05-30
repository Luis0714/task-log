"use client";

import Link from "next/link";

import { ACCOUNT_AUTH_COPY } from "@/components/auth/account-auth-copy";
import { ConnectMethodOauthAction } from "@/components/auth/connect-method-oauth-action";
import { LocalAccountFields } from "@/components/auth/local-account-fields";
import { Button } from "@/components/ui/button";
import {
  useLoginLocalForm,
  type UseLoginLocalFormOptions,
} from "@/hooks/auth/use-login-local-form";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";

export type LoginLocalFormProps = {
  connectOptions: ConnectAuthOptions;
  idPrefix?: string;
  registerHref?: string;
} & UseLoginLocalFormOptions;

export function LoginLocalForm({
  connectOptions,
  idPrefix = "login",
  registerHref = "/registro",
  onSuccess,
  onUserNotFound,
}: LoginLocalFormProps) {
  const copy = ACCOUNT_AUTH_COPY.login;
  const {
    email,
    password,
    submitting,
    errorMessage,
    setEmail,
    setPassword,
    submit,
  } = useLoginLocalForm({ onSuccess, onUserNotFound });

  return (
    <div className="space-y-6">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <LocalAccountFields
          idPrefix={idPrefix}
          email={email}
          password={password}
          copy={copy}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
        />

        {errorMessage ? (
          <p className="text-destructive text-sm" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? copy.submitting : copy.submit}
        </Button>
      </form>

      {connectOptions.oauthReady ? (
        <div className="space-y-3">
          <p className="text-muted-foreground text-center text-xs uppercase tracking-wide">
            {copy.microsoftDivider}
          </p>
          <ConnectMethodOauthAction
            continueLabel={copy.microsoftButton}
            hint={copy.microsoftHint}
            adminHint={copy.microsoftAdminHint}
          />
        </div>
      ) : null}

      <p className="text-center text-sm">
        {copy.noAccount}{" "}
        <Link
          href={registerHref}
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          {copy.registerLink}
        </Link>
      </p>
    </div>
  );
}
