import {
  Bot,
  Bug,
  CheckSquare,
  Clock,
  Flag,
  FolderKanban,
  History,
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
      { href: "/history", label: "Historial", icon: History },
    ],
  },
  {
    title: "Trabajo",
    items: [
      { href: "/time-log", label: "Registro de tiempo", icon: Clock },
      { href: "/work-items", label: "Historias de usuario", icon: ListTodo },
      { href: "/tasks", label: "Tareas", icon: CheckSquare },
      { href: "/bugs", label: "Bugs", icon: Bug },
    ],
  },
  {
    title: "Análisis",
    items: [
      { href: "/analysis/proyecto", label: "Proyecto", icon: FolderKanban },
      { href: "/analysis/sprints", label: "Sprints", icon: Flag },
    ],
  },
  {
    title: "Sistema",
    items: [{ href: "/settings", label: "Configuración", icon: Settings }],
  },
];
