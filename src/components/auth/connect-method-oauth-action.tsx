"use client";

import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { Button } from "@/components/ui/button";
import { startMicrosoftConnect } from "@/services/auth/connect-ado.service";

export function ConnectMethodOauthAction() {
  const copy = CONNECT_ADO_COPY.microsoft;

  return (
    <div className="space-y-3 pt-1">
      <Button type="button" className="w-full" onClick={startMicrosoftConnect}>
        {copy.continue}
      </Button>
      <p className="text-muted-foreground text-xs leading-relaxed">{copy.adminHint}</p>
    </div>
  );
}
