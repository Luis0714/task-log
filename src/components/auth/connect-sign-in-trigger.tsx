"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";

import { CONNECT_ADO_COPY } from "@/components/auth/connect-ado-copy";
import { ConnectAdoSheet } from "@/components/auth/connect-ado-sheet";
import { Button } from "@/components/ui/button";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { SavedConnectionTarget } from "@/lib/auth/server-state";
import { cn } from "@/lib/utils";

export type ConnectSignInTriggerProps = {
  connectOptions: ConnectAuthOptions;
  savedConnectionTarget?: SavedConnectionTarget | null;
  className?: string;
  fullWidth?: boolean;
  /**
   * Renderiza sólo el icono (sin texto). Lo usan los callers dentro de la
   * sidebar colapsada para que el botón no se desborde del rail angosto.
   */
  iconOnly?: boolean;
};

export function ConnectSignInTrigger({
  connectOptions,
  savedConnectionTarget: _savedConnectionTarget = null,
  className,
  fullWidth = false,
  iconOnly = false,
}: ConnectSignInTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        className={cn(fullWidth && "w-full", className)}
        onClick={() => setOpen(true)}
        title={iconOnly ? CONNECT_ADO_COPY.signInButton : undefined}
        aria-label={iconOnly ? CONNECT_ADO_COPY.signInButton : undefined}
      >
        <LogIn className="size-4" aria-hidden />
        {iconOnly ? null : CONNECT_ADO_COPY.signInButton}
      </Button>
      <ConnectAdoSheet
        connectOptions={connectOptions}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
