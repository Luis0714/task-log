"use client";

import { usePathname } from "next/navigation";

import { AdoProfileSync } from "@/components/connection/ado-profile-sync";
import { HistoryScopeProvider } from "@/components/history/history-scope-provider";
import { AppLogo } from "@/components/brand/app-logo";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AdoWorkItemLinksProvider } from "@/components/work-items/ado-work-item-links-context";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { AdoConnectionDisplay } from "@/lib/auth/connection-display";

export type AppShellProps = {
  connection: AdoConnectionDisplay;
  historyScopeKey?: string | null;
  defaultSidebarOpen?: boolean;
  sidebarConnection?: React.ReactNode;
  children: React.ReactNode;
  isAdmin?: boolean;
};

export function AppShell({
  connection,
  historyScopeKey = null,
  defaultSidebarOpen = true,
  sidebarConnection,
  children,
  isAdmin = false,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delay={0}>
      <HistoryScopeProvider scopeKey={historyScopeKey}>
        <AdoWorkItemLinksProvider organization={connection.organization}>
          <AdoProfileSync isConnected={connection.isConnected} />
          <SidebarProvider defaultOpen={defaultSidebarOpen}>
        <AppSidebar
          connection={connection}
          connectionFooter={sidebarConnection}
          activePath={pathname}
          isAdmin={isAdmin}
        />

        <SidebarInset className="min-w-0">
          <header className="border-border bg-background/90 sticky top-0 z-20 flex h-14 shrink-0 items-center border-b px-4 backdrop-blur-md md:hidden">
            <SidebarTrigger icon="menu" className="relative z-10 shrink-0" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <AppLogo
                compact
                isotipoBadge
                tone="surface"
                className="pointer-events-auto"
              />
            </div>
          </header>

          <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col p-4 sm:max-w-lg md:max-w-none md:p-6">
            {children}
          </div>
        </SidebarInset>
        </SidebarProvider>
        </AdoWorkItemLinksProvider>
      </HistoryScopeProvider>
    </TooltipProvider>
  );
}
