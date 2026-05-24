import { NavGroup, NavGroupList } from "@/components/navigation/nav-group";
import { NavItem, NavItemList } from "@/components/navigation/nav-item";
import type { NavGroupConfig } from "@/config/navigation";
import { isNavItemActive } from "@/lib/navigation/is-nav-active";

export type NavMenuProps = {
  groups: NavGroupConfig[];
  activePath: string;
};

export function NavMenu({ groups, activePath }: NavMenuProps) {
  return (
    <NavGroupList>
      {groups.map((group) => (
        <NavGroup key={group.title} title={group.title}>
          <NavItemList aria-label={group.title}>
            {group.items.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={isNavItemActive(activePath, item.href)}
              />
            ))}
          </NavItemList>
        </NavGroup>
      ))}
    </NavGroupList>
  );
}
