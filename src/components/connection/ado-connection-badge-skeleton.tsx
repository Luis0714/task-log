"use client";

import * as React from "react";
import { Cloud } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { SidebarContext } from "@/components/ui/sidebar";
import type { AdoConnectionDisplay } from "@/lib/auth/connection-display";
import { cn } from "@/lib/utils";

export type AdoConnectionBadgeSkeletonProps = {
  connection: AdoConnectionDisplay;
  className?: string;
};

export function AdoConnectionBadgeSkeleton({
  connection,
  className,
}: AdoConnectionBadgeSkeletonProps) {
  // Reads the sidebar context directly so it stays resilient when this
  // component is rendered as the fallback of a Server-Component Suspense
  // boundary that crosses the SSR streaming boundary (where the
  // `SidebarProvider` context is temporarily unavailable). Falls back to
  // the expanded skeleton.
  const context = React.useContext(SidebarContext);
  const collapsed = context?.state === "collapsed";
  const { isConnected, authMethod } = connection;

  if (collapsed) {
    return (
      <div className={cn("flex flex-col items-center gap-2 py-1", className)}>
        <Skeleton className="size-9 rounded-lg" />
        <div className="flex items-center gap-0.5">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <section
      aria-busy="true"
      aria-label="Cargando conexión con Azure DevOps"
      className={cn(
        "border-sidebar-border bg-sidebar-accent/25 flex flex-col gap-2.5 rounded-lg border p-3",
        className,
      )}
    >
      {isConnected ? (
        <div className="flex min-w-0 items-center gap-2">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "flex min-w-0 items-start gap-2.5",
          isConnected && "border-sidebar-border border-t pt-2.5",
        )}
      >
        <div
          className="bg-sidebar-primary/15 text-sidebar-primary flex size-9 shrink-0 items-center justify-center rounded-lg"
          aria-hidden
        >
          <Cloud className="size-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-20" />
          <span className="sr-only">{authMethod}</span>
        </div>
      </div>
    </section>
  );
}
