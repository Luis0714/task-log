import { Bot, Clock, LayoutDashboard, ListTodo, Settings } from "lucide-react";

import { NavItem, NavItemList } from "@/components/navigation/nav-item";

export default function Home() {
  return (
    <main className="flex min-h-full items-start justify-center p-8">
      <nav
        aria-label="Vista previa de navegación"
        className="w-56 rounded-lg border border-sidebar-border bg-sidebar p-2"
      >
        <NavItemList>
          <NavItem href="/" label="Dashboard" icon={LayoutDashboard} isActive />
          <NavItem href="/copilot" label="Copiloto IA" icon={Bot} />
          <NavItem href="/time-log" label="Registro de tiempo" icon={Clock} />
          <NavItem href="/work-items" label="Work Items" icon={ListTodo} />
          <NavItem href="/settings" label="Configuración" icon={Settings} />
        </NavItemList>
      </nav>
    </main>
  );
}
