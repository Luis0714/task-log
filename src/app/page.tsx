import { Bot, Clock, Kanban, LayoutDashboard, ListTodo, Settings } from "lucide-react";

import { AppLogo } from "@/components/brand/app-logo";
import { NavGroup, NavGroupList } from "@/components/navigation/nav-group";
import { NavItem, NavItemList } from "@/components/navigation/nav-item";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col gap-4 p-4 sm:max-w-lg">
      <header className="border-sidebar-border bg-sidebar/80 sticky top-0 z-10 -mx-4 border-b px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:rounded-xl sm:border sm:px-4">
        <AppLogo />
      </header>

      <nav
        aria-label="Vista previa de navegación"
        className="border-sidebar-border bg-sidebar w-full rounded-xl border p-3"
      >
        <NavGroupList>
          <NavGroup title="Principal">
            <NavItemList aria-label="Principal">
              <NavItem href="/" label="Dashboard" icon={LayoutDashboard} isActive />
              <NavItem href="/copilot" label="Copiloto IA" icon={Bot} />
            </NavItemList>
          </NavGroup>

          <NavGroup title="Trabajo">
            <NavItemList aria-label="Trabajo">
              <NavItem href="/time-log" label="Registro de tiempo" icon={Clock} />
              <NavItem href="/work-items" label="Work Items" icon={ListTodo} />
              <NavItem href="/sprint" label="Sprint / Kanban" icon={Kanban} />
            </NavItemList>
          </NavGroup>

          <NavGroup title="Sistema">
            <NavItemList aria-label="Sistema">
              <NavItem href="/settings" label="Configuración" icon={Settings} />
            </NavItemList>
          </NavGroup>
        </NavGroupList>
      </nav>
    </main>
  );
}
