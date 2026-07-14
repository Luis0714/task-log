"use client";

import type { ReactNode } from "react";

import { ConnectMethodPreview } from "@/components/auth/connect-method-preview";
import type { SessionAuthMethod } from "@/lib/auth/session-auth-method";
import { cn } from "@/lib/utils";

export type ConnectMethodOptionSectionProps = {
  method: SessionAuthMethod;
  name: string;
  title: string;
  description: string;
  selected: boolean;
  disabled: boolean;
  disabledHint?: string;
  action?: ReactNode;
  onSelect: (method: SessionAuthMethod) => void;
};

export function ConnectMethodOptionSection({
  method,
  name,
  title,
  description,
  selected,
  disabled,
  disabledHint,
  action,
  onSelect,
}: ConnectMethodOptionSectionProps) {
  const inputId = `connect-method-${method}`;

  return (
    <section
      className={cn(
        "rounded-lg border transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border bg-card",
        disabled && "opacity-60",
      )}
    >
      <label
        htmlFor={inputId}
        className={cn(
          "flex cursor-pointer items-start gap-3 p-4",
          disabled && "cursor-not-allowed",
        )}
      >
        <input
          id={inputId}
          type="radio"
          name={name}
          value={method}
          checked={selected}
          disabled={disabled}
          aria-label={title}
          className="border-input text-primary mt-1 size-4 shrink-0"
          onChange={() => onSelect(method)}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium leading-snug">{title}</p>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
      </label>

      {selected ? (
        <div className="border-border border-t px-4 pb-4">
          <div className="pt-3">
            {method === "oauth" ? <ConnectMethodPreview method={method} /> : null}
            {disabled && disabledHint ? (
              <p className="text-destructive mt-3 text-xs leading-relaxed">{disabledHint}</p>
            ) : (
              action
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
