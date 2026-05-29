"use client";

import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { ConnectPatFormFields } from "@/components/auth/connect-pat-form-fields";
import { Button } from "@/components/ui/button";
import { useConnectPatForm } from "@/hooks/auth/use-connect-pat-form";
import type { SavedConnectionTarget } from "@/lib/auth/server-state";

export type ConnectMethodPatActionProps = {
  savedConnectionTarget?: SavedConnectionTarget | null;
  onConnected?: () => void;
};

export function ConnectMethodPatAction({
  savedConnectionTarget = null,
  onConnected,
}: ConnectMethodPatActionProps) {
  const copy = CONNECT_ADO_COPY.pat;
  const {
    pat,
    organization,
    project,
    team,
    adoUrl,
    urlParseError,
    submitting,
    errorMessage,
    setPat,
    setOrganization,
    setProject,
    setTeam,
    setAdoUrl,
    submit,
  } = useConnectPatForm({ savedConnectionTarget, onSuccess: onConnected });

  return (
    <form
      className="space-y-3 pt-1"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
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
        {submitting ? copy.connecting : copy.connect}
      </Button>
    </form>
  );
}
