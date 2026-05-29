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
};

export function ConnectSignInTrigger({
  connectOptions,
  savedConnectionTarget = null,
  className,
  fullWidth = false,
}: ConnectSignInTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        className={cn(fullWidth && "w-full", className)}
        onClick={() => setOpen(true)}
      >
        <LogIn className="size-4" aria-hidden />
        {CONNECT_ADO_COPY.signInButton}
      </Button>
      <ConnectAdoSheet
        connectOptions={connectOptions}
        savedConnectionTarget={savedConnectionTarget}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
