"use client";

import { useState, type ReactNode } from "react";

import { SettingsSourceBadge } from "@/components/settings/settings-source-badge";
import type { SettingsFieldCopy } from "@/lib/settings/settings-field-copy";
import type { AdoProcessProfileFieldSource } from "@/lib/azure-devops/process-profile-types";
import { cn } from "@/lib/utils";

export type SettingsFieldRowProps = {
  copy: SettingsFieldCopy;
  source?: AdoProcessProfileFieldSource;
  referenceName?: string;
  children: ReactNode;
};

export function SettingsFieldRow({
  copy,
  source,
  referenceName,
  children,
}: SettingsFieldRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 border-b border-border/60 py-4 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium">{copy.label}</h3>
            {source ? <SettingsSourceBadge source={source} /> : null}
          </div>
          <p className="text-muted-foreground text-sm">{copy.shortHelp}</p>
          <p className="text-muted-foreground text-xs">
            <span className="font-medium text-foreground/80">Usado en:</span> {copy.usedIn}
          </p>
        </div>
        <button
          type="button"
          className="text-primary shrink-0 text-xs underline-offset-4 hover:underline"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Ocultar ayuda" : "¿Qué es esto?"}
        </button>
      </div>

      {open ? (
        <p className="text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 text-xs leading-relaxed">
          {copy.detail}
          {referenceName ? (
            <>
              {" "}
              <span className="font-medium text-foreground/80">Reference name:</span>{" "}
              <code className="text-foreground/90">{referenceName}</code>
            </>
          ) : null}
        </p>
      ) : null}

      <div className={cn("max-w-md")}>{children}</div>
    </div>
  );
}
