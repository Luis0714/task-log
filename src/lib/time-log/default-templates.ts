/**
 * Catálogo declarativo de plantillas del sistema. La siembra real vive en la
 * migración `0015_time_log_templates_global.sql`; este archivo solo conserva
 * la lista para referencia y el helper `seedKeyForRoleName` que mapea el rol
 * del usuario a su seedKey.
 */
export type SeedTemplate = {
  /** Clave del rol (developer / qa / designer / product-owner) o "global". */
  seedKey: string;
  name: string;
  defaultTitle: string;
  defaultDescription: string;
};

export const GLOBAL_TEMPLATE_SEED_KEY = "global";

export const DEFAULT_TEMPLATES: ReadonlyArray<SeedTemplate> = [
  // ---------- Developer ----------
  {
    seedKey: "developer",
    name: "Desarrollo",
    defaultTitle: "Desarrollo de funcionalidad",
    defaultDescription:
      "Implementación, ajuste o mejora de funcionalidades asignadas dentro del sprint.",
  },
  {
    seedKey: "developer",
    name: "Corrección de Bug",
    defaultTitle: "Corrección de incidencia",
    defaultDescription:
      "Análisis, corrección y validación de errores reportados en el sistema.",
  },

  // ---------- QA ----------
  {
    seedKey: "qa",
    name: "Ejecución de Pruebas",
    defaultTitle: "Ejecución de pruebas funcionales",
    defaultDescription:
      "Validación de funcionalidades desarrolladas y verificación de criterios de aceptación.",
  },
  {
    seedKey: "qa",
    name: "Reporte de Bug",
    defaultTitle: "Análisis y reporte de incidencia",
    defaultDescription:
      "Identificación, documentación y seguimiento de errores encontrados durante las pruebas.",
  },

  // ---------- Diseñador ----------
  {
    seedKey: "designer",
    name: "Diseño de Interfaz",
    defaultTitle: "Diseño de experiencia e interfaz",
    defaultDescription:
      "Creación o ajuste de diseños, flujos y componentes visuales de la aplicación.",
  },
  {
    seedKey: "designer",
    name: "Revisión de Diseño",
    defaultTitle: "Revisión y validación de propuesta visual",
    defaultDescription:
      "Análisis de experiencia de usuario, consistencia visual y validación de requerimientos de diseño.",
  },

  // ---------- Product Owner ----------
  {
    seedKey: "product-owner",
    name: "Refinamiento de Backlog",
    defaultTitle: "Refinamiento de backlog",
    defaultDescription:
      "Análisis, definición y ajuste de historias de usuario para próximas iteraciones.",
  },
  {
    seedKey: "product-owner",
    name: "Gestión Funcional",
    defaultTitle: "Gestión y seguimiento funcional",
    defaultDescription:
      "Revisión de avances, validación funcional y coordinación de requerimientos con el equipo.",
  },

  // ---------- Global (todos los roles) ----------
  {
    seedKey: GLOBAL_TEMPLATE_SEED_KEY,
    name: "Reunión",
    defaultTitle: "Participación en reunión",
    defaultDescription:
      "Participación en sesiones de seguimiento, planeación, refinamiento, retrospectiva o coordinación del proyecto.",
  },
];

/**
 * Mapea el nombre interno del rol (almacenado en `roles.name` en la DB)
 * al `seedKey` correspondiente en el catálogo de plantillas.
 *
 * Devuelve `null` si el rol no tiene plantillas predefinidas — el seeder
 * solo sembrará las globales en ese caso.
 */
export function seedKeyForRoleName(
  roleName: string | null | undefined,
): string | null {
  if (!roleName) return null;
  const normalized = roleName.trim().toLowerCase();
  if (normalized.includes("developer") || normalized.includes("desarrollador")) {
    return "developer";
  }
  if (normalized.includes("qa") || normalized.includes("tester")) {
    return "qa";
  }
  if (normalized.includes("design") || normalized.includes("diseñ")) {
    return "designer";
  }
  if (
    normalized.includes("product") ||
    normalized.includes("po") ||
    normalized.includes("owner")
  ) {
    return "product-owner";
  }
  return null;
}
