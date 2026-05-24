"use client";

import { AppLogo } from "@/components/brand/app-logo";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarBrand() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <AppLogo
      compact={collapsed}
      showTagline={!collapsed}
      className={collapsed ? "mx-auto" : undefined}
    />
  );
}
