"use client";

import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { Button } from "@/components/ui/button";
import { startMicrosoftConnect } from "@/services/auth/connect-ado.service";

export type ConnectMethodOauthActionProps = {
  continueLabel?: string;
  hint?: string;
  adminHint?: string;
  /**
   * Rol seleccionado por el usuario. Si es `null`, el botón queda deshabilitado.
   * Si es `undefined` (sin control), el botón permanece habilitado como antes.
   */
  selectedRole?: string | null;
};

export function ConnectMethodOauthAction({
  continueLabel,
  hint,
  adminHint,
  selectedRole,
}: ConnectMethodOauthActionProps = {}) {
  const copy = CONNECT_ADO_COPY.microsoft;
  const isDisabled = selectedRole === null;

  return (
    <div className="space-y-3">
      {hint ? (
        <p className="text-muted-foreground text-xs leading-relaxed">{hint}</p>
      ) : null}
      <Button
        type="button"
        className="w-full"
        disabled={isDisabled}
        onClick={() => {
          if (selectedRole) startMicrosoftConnect(selectedRole);
        }}
      >
        {continueLabel ?? copy.continue}
      </Button>
      <p className="text-muted-foreground text-xs leading-relaxed">
        {adminHint ?? copy.adminHint}
      </p>
    </div>
  );
}
