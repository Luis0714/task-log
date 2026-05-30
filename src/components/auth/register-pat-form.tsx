"use client";

import Link from "next/link";

import { ACCOUNT_AUTH_COPY } from "@/components/auth/account-auth-copy";
import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { ConnectPatFormFields } from "@/components/auth/connect-pat-form-fields";
import { LocalAccountFields } from "@/components/auth/local-account-fields";
import { Button } from "@/components/ui/button";
import { useRegisterPatForm } from "@/hooks/auth/use-register-pat-form";

export function RegisterPatForm() {
  const copy = ACCOUNT_AUTH_COPY.register;
  const patCopy = CONNECT_ADO_COPY.pat;
  const {
    email,
    password,
    pat,
    organization,
    project,
    team,
    adoUrl,
    urlParseError,
    submitting,
    errorMessage,
    setEmail,
    setPassword,
    setPat,
    setOrganization,
    setProject,
    setTeam,
    setAdoUrl,
    submit,
  } = useRegisterPatForm();

  return (
    <div className="space-y-4">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <LocalAccountFields
          idPrefix="register"
          email={email}
          password={password}
          copy={copy}
          passwordAutoComplete="new-password"
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
        />

        <p className="text-muted-foreground text-sm leading-relaxed">
          {patCopy.intro}
        </p>

        <ConnectPatFormFields
          pat={pat}
          organization={organization}
          project={project}
          team={team}
          adoUrl={adoUrl}
          urlParseError={urlParseError}
          onPatChange={setPat}
          onOrganizationChange={setOrganization}
          onProjectChange={setProject}
          onTeamChange={setTeam}
          onAdoUrlChange={setAdoUrl}
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

      <p className="text-center text-sm">
        {copy.hasAccount}{" "}
        <Link
          href="/login"
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          {copy.loginLink}
        </Link>
      </p>
    </div>
  );
}
