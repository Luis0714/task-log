"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";

import { FeatureBadge } from "@/components/ui/feature-badge";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export type NavItemProps = {
  href: string;
  label: string;
  icon: IconType;
  isActive?: boolean;
  className?: string;
  badge?: "new" | "plan";
};

export function NavItem({
  href,
  label,
  icon: Icon,
  isActive = false,
  className,
  badge,
}:Readonly<NavItemProps>) {
  const { isMobile, setOpenMobile } = useSidebar();
  const tooltipContent: ReactNode = badge ? (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <FeatureBadge variant={badge} />
    </span>
  ) : (
    label
  );

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={{ children: tooltipContent }}
        render={
          <Link
            href={href}
            aria-current={isActive ? "page" : undefined}
            onClick={() => {
              if (isMobile) setOpenMobile(false);
            }}
          />
        }
        className={cn(
          "data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:shadow-sm",
          className,
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        <span>{label}</span>
      </SidebarMenuButton>
      {badge ? (
        <FeatureBadge
          variant={badge}
          floating
          className="group-data-[collapsible=icon]:hidden"
        />
      ) : null}
    </SidebarMenuItem>
  );
}

export type NavItemListProps = {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
};

export function NavItemList({
  children,
  className,
  "aria-label": ariaLabel = "Navegación principal",
}: Readonly<NavItemListProps>) {
  return (
    <SidebarMenu className={className} aria-label={ariaLabel}>
      {children}
    </SidebarMenu>
  );
}
