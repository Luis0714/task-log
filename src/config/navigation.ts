import {
  Bug,
  CheckSquare,
  Clock,
  LayoutDashboard,
  ListTodo,
  Settings,
  Users,
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

/**
 * Kill-switch para ocultar el grupo "Sistema" (Configuración) del menú lateral.
 * La página /settings y todo su código permanecen intactos para poder
 * re-habilitarlo en el futuro cambiando este flag a `false`.
 */
const HIDE_SETTINGS_NAV = true;

const BASE_NAVIGATION: NavGroupConfig[] = [
  {
    title: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
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
  ...(HIDE_SETTINGS_NAV
    ? []
    : [
        {
          title: "Sistema",
          items: [
            { href: "/settings", label: "Configuración", icon: Settings },
          ],
        },
      ]),
];

export function getNavigation(isAdmin: boolean): NavGroupConfig[] {
  if (!isAdmin) return BASE_NAVIGATION;
  return [
    ...BASE_NAVIGATION,
    {
      title: "Administración",
      items: [{ href: "/admin/usuarios", label: "Usuarios", icon: Users }],
    },
  ];
}

export const MAIN_NAVIGATION = getNavigation(false);
