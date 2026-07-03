import { Fragment } from "react";

import { NavGroup, NavGroupList } from "@/components/navigation/nav-group";
import { NavItem, NavItemList } from "@/components/navigation/nav-item";
import { SidebarSeparator } from "@/components/ui/sidebar";
import type { NavGroupConfig } from "@/config/navigation";
import { isNavItemActive } from "@/lib/navigation/is-nav-active";

export type NavMenuProps = {
  groups: NavGroupConfig[];
  activePath: string;
};

export function NavMenu({ groups, activePath }: NavMenuProps) {
  const lastGroupIndex = groups.length - 1;

  return (
    <NavGroupList className="h-full">
      {groups.map((group, index) => (
        <Fragment key={group.title}>
          {index > 0 ? (
            <SidebarSeparator className="mx-auto hidden w-6 group-data-[collapsible=icon]:my-1 group-data-[collapsible=icon]:block" />
          ) : null}
          <NavGroup
            title={group.title}
            className={index === lastGroupIndex ? "mt-auto" : undefined}
          >
            <NavItemList aria-label={group.title}>
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  badge={item.badge}
                  isActive={isNavItemActive(activePath, item.href)}
                />
              ))}
            </NavItemList>
          </NavGroup>
        </Fragment>
      ))}
    </NavGroupList>
  );
}
