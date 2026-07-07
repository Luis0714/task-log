import {
  Bug,
  CalendarCheck2,
  CheckSquare,
  Clock,
  FileSpreadsheet,
  LayoutDashboard,
  ListTodo,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import type { IconType } from "react-icons";
import { TbTemplate } from "react-icons/tb";

/** Acepta lucide-react y react-icons como componentes opacos con `className`. */
export type NavIcon = IconType;

export type NavItemConfig = {
  href: string;
  label: string;
  icon: NavIcon;
  badge?: "new" | "plan";
  /** Oculta el item cuando es `false`. Por defecto `true`. */
  visible?: boolean;
  /** Si se indica, solo se muestra a usuarios con alguno de estos roles. */
  roles?: readonly string[];
};

export type NavGroupConfig = {
  title: string;
  items: NavItemConfig[];
};

const ALL_NAVIGATION: NavGroupConfig[] = [
  {
    title: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/neos-ia", label: "Neos IA", icon: Sparkles, visible: true, roles: ["super_admin"] },
    ],
  },
  {
    title: "Trabajo",
    items: [
      { href: "/time-log", label: "Registro de tiempo", icon: Clock },
      { href: "/work-items", label: "Historias de usuario", icon: ListTodo },
      { href: "/tasks", label: "Tareas", icon: CheckSquare },
      { href: "/bugs", label: "Bugs", icon: Bug },
      { href: "/daily", label: "Resumen del daily", icon: CalendarCheck2, visible: false },
    ],
  },
  {
    title: "Análisis",
    items: [
      {
        href: "/analysis/sprints",
        label: "Sprint",
        icon: CalendarCheck2,
        visible: false,
        roles: ["super_admin", "product_manager", "scrum_master"],
      },
      { href: "/analysis/proyecto", label: "Proyecto", icon: LayoutDashboard, visible: false },
    ],
  },
  {
    title: "Reportes",
    items: [
      {
        href: "/reports/time-log",
        label: "Tiempos registrados",
        icon: FileSpreadsheet,
        roles: ["super_admin", "product_manager", "product_owner", "scrum_master"],
      },
    ],
  },
  {
    title: "Administración",
    items: [
      { href: "/admin/usuarios", label: "Usuarios", icon: Users, roles: ["super_admin"] },
      { href: "/admin/plantillas", label: "Plantillas", icon: TbTemplate, roles: ["super_admin"] },
    ],
  },
  {
    title: "Sistema",
    items: [{ href: "/settings", label: "Configuración", icon: Settings }],
  },
];

function isItemVisible(item: NavItemConfig, userRole: string | null): boolean {
  if (item.visible === false) return false;
  if (item.roles) return userRole !== null && item.roles.includes(userRole);
  return true;
}

export function getNavigation(userRole: string | null): NavGroupConfig[] {
  return ALL_NAVIGATION
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isItemVisible(item, userRole)),
    }))
    .filter((group) => group.items.length > 0);
}

export const MAIN_NAVIGATION = getNavigation(null);
