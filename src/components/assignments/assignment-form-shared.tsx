"use client";

import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";

export type FieldShellProps = {
  label: string;
  htmlFor?: string;
  description?: string;
  error?: string | null;
  children: ReactNode;
};

export function FieldShell({
  label,
  htmlFor,
  description,
  error,
  children,
}: FieldShellProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {description ? (
        <p className="text-muted-foreground text-xs">{description}</p>
      ) : null}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}

export type TwoColumnRowProps = {
  children: ReactNode;
};

export function TwoColumnRow({ children }: TwoColumnRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  );
}
