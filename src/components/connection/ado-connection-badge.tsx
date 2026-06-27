"use client";

import * as React from "react";

import { ConnectionBadgeCollapsed } from "@/components/connection/connection-badge-collapsed";
import { ConnectionBadgeExpanded } from "@/components/connection/connection-badge-expanded";
import { SidebarContext } from "@/components/ui/sidebar";
import type { AdoConnectionDisplay } from "@/lib/auth/connection-display";

export type AdoConnectionBadgeProps = AdoConnectionDisplay & {
  className?: string;
};

export function AdoConnectionBadge(props: AdoConnectionBadgeProps) {
  // Reads the sidebar context directly so it stays resilient when this
  // component is rendered through a Server-Component Suspense boundary
  // that crosses the SSR streaming boundary (where the `SidebarProvider`
  // context is temporarily unavailable). Falls back to the expanded view.
  const context = React.useContext(SidebarContext);
  const collapsed = context?.state === "collapsed";

  if (collapsed) {
    return <ConnectionBadgeCollapsed {...props} />;
  }

  return <ConnectionBadgeExpanded {...props} />;
}
