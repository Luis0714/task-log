import {
  Bug,
  CalendarCheck2,
  CheckSquare,
  Clock,
  LayoutDashboard,
  ListTodo,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import type { IconType } from "react-icons";
import { TbTemplate } from "react-icons/tb";

/**
 * Tipo compartido para los iconos del menú lateral. Acepta tanto los
 * iconos de `lucide-react` (componentes `LucideIcon`) como los de
 * `react-icons` (componentes `IconType`) porque en el sidebar los
 * tratamos como componentes opacos que solo reciben `className`.
 */
export type NavIcon = IconType;

export type NavItemConfig = {
  href: string;
  label: string;
  icon: NavIcon;
  /**
   * Badge semántico opcional para destacar el item en el sidebar.
   * Se renderiza vía `FeatureBadge` en `NavItem`.
   */
  badge?: "new" | "plan";
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
const HIDE_SETTINGS_NAV = false;

/**
 * Kill-switch para ocultar la entrada "Resumen del daily" del menú lateral.
 * La página /daily y todo su código permanecen intactos para poder
 * re-habilitarla en el futuro cambiando este flag a `false`.
 */
const HIDE_DAILY_NAV = true;

/**
 * Kill-switch para ocultar la entrada "Neos IA" del menú lateral.
 * La página /neos-ia y todo su código permanecen intactos; cambiar este
 * flag a `false` los re-habilita.
 */
const HIDE_NEOS_IA_NAV = false;

const BASE_NAVIGATION: NavGroupConfig[] = [
  {
    title: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      ...(HIDE_NEOS_IA_NAV
        ? []
        : [{ href: "/neos-ia", label: "Neos IA", icon: Sparkles }]),
    ],
  },
  {
    title: "Trabajo",
    items: [
      { href: "/time-log", label: "Registro de tiempo", icon: Clock },
      { href: "/work-items", label: "Historias de usuario", icon: ListTodo },
      { href: "/tasks", label: "Tareas", icon: CheckSquare },
      { href: "/bugs", label: "Bugs", icon: Bug },
      ...(HIDE_DAILY_NAV
        ? []
        : [
            {
              href: "/daily",
              label: "Resumen del daily",
              icon: CalendarCheck2,
            },
          ]),
    ],
  },
];

const SETTINGS_GROUP: NavGroupConfig = {
  title: "Sistema",
  items: [{ href: "/settings", label: "Configuración", icon: Settings }],
};

export function getNavigation(isAdmin: boolean): NavGroupConfig[] {
  const groups = [...BASE_NAVIGATION];

  if (isAdmin) {
    groups.push({
      title: "Administración",
      items: [
        { href: "/admin/usuarios", label: "Usuarios", icon: Users },
        { href: "/admin/plantillas", label: "Plantillas", icon: TbTemplate },
      ],
    });
  }

  if (!HIDE_SETTINGS_NAV) {
    groups.push(SETTINGS_GROUP);
  }

  return groups;
}

export const MAIN_NAVIGATION = getNavigation(false);
