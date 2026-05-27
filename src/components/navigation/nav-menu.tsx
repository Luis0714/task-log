import { NavGroup, NavGroupList } from "@/components/navigation/nav-group";
import { NavItem, NavItemList } from "@/components/navigation/nav-item";
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
        <NavGroup
          key={group.title}
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
                isActive={isNavItemActive(activePath, item.href)}
              />
            ))}
          </NavItemList>
        </NavGroup>
      ))}
    </NavGroupList>
  );
}
