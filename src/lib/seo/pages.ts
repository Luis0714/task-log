export type PageSeoEntry = {
  title: string;
  description: string;
  path: `/${string}` | "/";
};

export const PAGE_SEO = {
  dashboard: {
    title: "Dashboard",
    description:
      "Visibilidad del sprint en tiempo real: entrega, ritmo de horas, trabajo por estado y resumen del daily conectado a Azure DevOps.",
    path: "/",
  },
  neosIa: {
    title: "Neos IA",
    description:
      "Gestiona y registra trabajo en Azure DevOps con lenguaje natural. Crea tareas, registra horas y opera el sprint con asistencia de IA.",
    path: "/neos-ia",
  },
  history: {
    title: "Historial",
    description:
      "Consulta el historial reciente de ejecuciones del registro de tiempo guardado en este navegador.",
    path: "/history",
  },
  timeLog: {
    title: "Registro de tiempo",
    description:
      "Registra horas de trabajo en tareas del sprint con contexto de proyecto, equipo y fecha de trabajo en Azure DevOps.",
    path: "/time-log",
  },
  sprints: {
    title: "Sprints",
    description:
      "Consulta y analiza sprints del equipo con filtros por proyecto, equipo y sprint en Azure DevOps.",
    path: "/analysis/sprints",
  },
  proyecto: {
    title: "Proyecto",
    description:
      "Análisis y visibilidad del proyecto conectado a Azure DevOps.",
    path: "/analysis/proyecto",
  },
  workItems: {
    title: "Historias de usuario",
    description:
      "Historias de usuario del sprint con filtros por estado, asignación y prioridad. Visibilidad clara del backlog activo.",
    path: "/work-items",
  },
  tasks: {
    title: "Tareas",
    description:
      "Tareas del sprint con filtros por asignación, estado y día de trabajo. Seguimiento operativo del trabajo diario.",
    path: "/tasks",
  },
  bugs: {
    title: "Bugs",
    description:
      "Bugs del sprint con filtros por asignación, estado y fecha. Control de calidad integrado con tu flujo Agile.",
    path: "/bugs",
  },
  daily: {
    title: "Resumen del daily",
    description:
      "Genera un resumen breve de tu trabajo en curso para compartir en la reunión diaria del sprint activo.",
    path: "/daily",
  },
  reportsTimeLog: {
    title: "Reporte de horas por periodo",
    description:
      "Genera un reporte de horas trabajadas por periodo con horas esperadas, desarrollo, bugs, novedades y % de cumplimiento por persona, proyecto y equipo. Exporta a Excel.",
    path: "/reports/time-log",
  },
  reportsSprintHours: {
    title: "Reporte de horas por sprint",
    description:
      "Consulta las horas registradas por cada persona durante el sprint seleccionado, desglosadas por semana y tipo de trabajo (desarrollo y bugs), con totales por equipo. Permite ocultar personas, compartir el resumen y exportar a Excel.",
    path: "/reports/sprint-hours",
  },
  settings: {
    title: "Configuración",
    description:
      "Conexión con Azure DevOps, proyecto, equipo y preferencias de la cuenta en NeosView.",
    path: "/settings",
  },
  assignments: {
    title: "Asignaciones",
    description:
      "Configura el porcentaje de dedicación de cada persona en cada equipo dentro de cada proyecto.",
    path: "/admin/asignaciones",
  },
  privacy: {
    title: "Política de privacidad",
    description:
      "Cómo NeosView trata datos de sesión, Microsoft Entra ID, Azure DevOps y el copiloto IA.",
    path: "/privacy",
  },
  terms: {
    title: "Términos del servicio",
    description:
      "Condiciones de uso de NeosView, acceso a Azure DevOps y responsabilidades del usuario.",
    path: "/terms",
  },
} as const satisfies Record<string, PageSeoEntry>;
