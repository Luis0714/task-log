"use client";

import { ACCOUNT_AUTH_COPY } from "@/components/auth/account-auth-copy";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useSuperAdminLoginForm } from "@/hooks/auth/use-super-admin-login-form";

export function SuperAdminLoginForm() {
  const copy = ACCOUNT_AUTH_COPY.superAdmin;
  const { password, submitting, errorMessage, setPassword, submit } =
    useSuperAdminLoginForm();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <p className="text-muted-foreground text-xs leading-relaxed">{copy.hint}</p>

      <div className="space-y-1.5">
        <Label htmlFor="super-admin-password">{copy.passwordLabel}</Label>
        <PasswordInput
          id="super-admin-password"
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
  );
}
