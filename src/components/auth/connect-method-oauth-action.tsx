"use client";

import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { Button } from "@/components/ui/button";
import { startMicrosoftConnect } from "@/services/auth/connect-ado.service";

export type ConnectMethodOauthActionProps = {
  continueLabel?: string;
  hint?: string;
  adminHint?: string;
};

export function ConnectMethodOauthAction({
  continueLabel,
  hint,
  adminHint,
}: ConnectMethodOauthActionProps = {}) {
  const copy = CONNECT_ADO_COPY.microsoft;

  return (
    <div className="space-y-3">
      {hint ? (
        <p className="text-muted-foreground text-xs leading-relaxed">{hint}</p>
      ) : null}
      <Button type="button" className="w-full" onClick={startMicrosoftConnect}>
        {continueLabel ?? copy.continue}
      </Button>
      <p className="text-muted-foreground text-xs leading-relaxed">
        {adminHint ?? copy.adminHint}
      </p>
    </div>
  );
}
