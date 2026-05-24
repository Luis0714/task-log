"use client";

import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/layout/app-sidebar";
import type { AdoConnectionDisplay } from "@/lib/auth/connection-display";

export type AppShellProps = {
  connection: AdoConnectionDisplay;
  children: React.ReactNode;
};

export function AppShell({ connection, children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="bg-background flex min-h-full flex-col md:flex-row">
      <AppSidebar
        connection={connection}
        activePath={pathname}
        className="md:w-64 md:shrink-0"
      />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col p-4 sm:max-w-lg md:max-w-none md:p-6">
        {children}
      </main>
    </div>
  );
}
