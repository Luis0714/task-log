"use client";

import { ConnectionBadgeCollapsed } from "@/components/connection/connection-badge-collapsed";
import { ConnectionBadgeExpanded } from "@/components/connection/connection-badge-expanded";
import { useSidebar } from "@/components/ui/sidebar";
import type { AdoConnectionDisplay } from "@/lib/auth/connection-display";

export type AdoConnectionBadgeProps = AdoConnectionDisplay & {
  className?: string;
};

export function AdoConnectionBadge(props: AdoConnectionBadgeProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  if (collapsed) {
    return <ConnectionBadgeCollapsed {...props} />;
  }

  return <ConnectionBadgeExpanded {...props} />;
}
