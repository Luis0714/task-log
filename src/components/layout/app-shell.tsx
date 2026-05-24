"use client";

import { usePathname } from "next/navigation";

import { AppLogo } from "@/components/brand/app-logo";
import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { AdoConnectionDisplay } from "@/lib/auth/connection-display";

export type AppShellProps = {
  connection: AdoConnectionDisplay;
  defaultSidebarOpen?: boolean;
  children: React.ReactNode;
};

export function AppShell({
  connection,
  defaultSidebarOpen = true,
  children,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delay={0}>
      <SidebarProvider defaultOpen={defaultSidebarOpen}>
        <AppSidebar connection={connection} activePath={pathname} />

        <SidebarInset>
          <header className="border-border bg-background/90 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-md md:hidden">
            <SidebarTrigger />
            <AppLogo compact showTagline={false} />
          </header>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col p-4 sm:max-w-lg md:max-w-none md:p-6">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
