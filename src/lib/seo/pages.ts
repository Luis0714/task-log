export type PageSeoEntry = {
  title: string;
  description: string;
  path: `/${string}` | "/";
};

export const PAGE_SEO = {
  dashboard: {
    title: "Panel",
    description:
      "Visibilidad del sprint en tiempo real: entrega, ritmo de horas, trabajo por estado y resumen del daily conectado a Azure DevOps.",
    path: "/",
  },
  copilot: {
    title: "Copiloto IA",
    description:
      "Gestiona y registra trabajo en Azure DevOps con lenguaje natural. Crea tareas, registra horas y opera el sprint con asistencia de IA.",
    path: "/copilot",
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
  settings: {
    title: "Configuración",
    description:
      "Conexión con Azure DevOps, proyecto, equipo y preferencias de la cuenta en NeosView.",
    path: "/settings",
  },
} as const satisfies Record<string, PageSeoEntry>;
