import {
  Bot,
  Clock,
  Kanban,
  LayoutDashboard,
  ListTodo,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItemConfig = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroupConfig = {
  title: string;
  items: NavItemConfig[];
};

export const MAIN_NAVIGATION: NavGroupConfig[] = [
  {
    title: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/copilot", label: "Copiloto IA", icon: Bot },
    ],
  },
  {
    title: "Trabajo",
    items: [
      { href: "/time-log", label: "Registro de tiempo", icon: Clock },
      { href: "/work-items", label: "Work Items", icon: ListTodo },
      { href: "/sprint", label: "Sprint / Kanban", icon: Kanban },
    ],
  },
  {
    title: "Sistema",
    items: [{ href: "/settings", label: "Configuración", icon: Settings }],
  },
];
