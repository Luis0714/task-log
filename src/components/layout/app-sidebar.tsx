"use client";

import { SidebarBrand } from "@/components/layout/sidebar-brand";
import { SidebarFloatingExpandTrigger } from "@/components/layout/sidebar-floating-expand-trigger";
import { AdoConnectionBadge } from "@/components/connection/ado-connection-badge";
import { NavMenu } from "@/components/navigation/nav-menu";
import { MAIN_NAVIGATION } from "@/config/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import type { AdoConnectionDisplay } from "@/lib/auth/connection-display";
import { cn } from "@/lib/utils";

export type AppSidebarProps = {
  connection: AdoConnectionDisplay;
  connectionFooter?: React.ReactNode;
  activePath: string;
};

function SidebarHeaderContent() {
  const { state, isMobile } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <div
      className={cn(
        "flex w-full items-center gap-2",
        collapsed && !isMobile ? "justify-center" : "justify-between",
      )}
    >
      <SidebarBrand />
      {(!collapsed || isMobile) && <SidebarTrigger className="shrink-0" />}
    </div>
  );
}

export function AppSidebar({ connection, connectionFooter, activePath }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-sidebar-border border-b px-3 py-3">
        <SidebarHeaderContent />
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <NavMenu groups={MAIN_NAVIGATION} activePath={activePath} />
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border border-t p-2">
        {connectionFooter ?? <AdoConnectionBadge {...connection} />}
      </SidebarFooter>

      <SidebarRail />
      <SidebarFloatingExpandTrigger />
    </Sidebar>
  );
}
