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

type SeedTemplateRow = [
  seedKey: string,
  name: string,
  defaultTitle: string,
  defaultDescription: string,
];

const TEMPLATE_ROWS: ReadonlyArray<SeedTemplateRow> = [
  // Developer
  ["developer", "Desarrollo", "Desarrollo de funcionalidad", "Implementación, ajuste o mejora de funcionalidades asignadas dentro del sprint."],
  ["developer", "Corrección de Bug", "Corrección de incidencia", "Análisis, corrección y validación de errores reportados en el sistema."],
  // QA
  ["qa", "Ejecución de Pruebas", "Ejecución de pruebas funcionales", "Validación de funcionalidades desarrolladas y verificación de criterios de aceptación."],
  ["qa", "Reporte de Bug", "Análisis y reporte de incidencia", "Identificación, documentación y seguimiento de errores encontrados durante las pruebas."],
  // Diseñador
  ["designer", "Diseño de Interfaz", "Diseño de experiencia e interfaz", "Creación o ajuste de diseños, flujos y componentes visuales de la aplicación."],
  ["designer", "Revisión de Diseño", "Revisión y validación de propuesta visual", "Análisis de experiencia de usuario, consistencia visual y validación de requerimientos de diseño."],
  // Product Owner
  ["product-owner", "Refinamiento de Backlog", "Refinamiento de backlog", "Análisis, definición y ajuste de historias de usuario para próximas iteraciones."],
  ["product-owner", "Gestión Funcional", "Gestión y seguimiento funcional", "Revisión de avances, validación funcional y coordinación de requerimientos con el equipo."],
  // Global (todos los roles)
  [GLOBAL_TEMPLATE_SEED_KEY, "Reunión", "Participación en reunión", "Participación en sesiones de seguimiento, planeación, refinamiento, retrospectiva o coordinación del proyecto."],
];

export const DEFAULT_TEMPLATES: ReadonlyArray<SeedTemplate> = TEMPLATE_ROWS.map(
  ([seedKey, name, defaultTitle, defaultDescription]) => ({
    seedKey,
    name,
    defaultTitle,
    defaultDescription,
  }),
);

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
