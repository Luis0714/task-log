"use client";

import { AdoConnectionBadge } from "@/components/connection/ado-connection-badge";
import type { AdoConnectionDisplay } from "@/lib/auth/connection-display";

export type ShellSidebarConnectionProps = {
  connection: AdoConnectionDisplay;
};

export function ShellSidebarConnection({ connection }: Readonly<ShellSidebarConnectionProps>) {
  return <AdoConnectionBadge {...connection} />;
}