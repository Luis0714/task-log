export const CONNECT_ADO_COPY = {
  sheetTitle: "Conectar con Azure DevOps",
  sheetSubtitle: "Elige cómo quieres entrar. Solo necesitas una opción.",
  signInButton: "Iniciar sesión",
  back: "Volver",
  chooseMethodAriaLabel: "Método de inicio de sesión",
  microsoft: {
    cardTitle: "Con mi cuenta de Microsoft",
    cardDescription: "La forma más cómoda si ya usas Azure DevOps en el trabajo.",
    panelTitle: "Entrar con tu cuenta",
    intro:
      "Usaremos la misma cuenta con la que entras a Azure DevOps. No hace falta recordar otra contraseña aquí.",
    adminNote:
      "La primera vez puede pedirte confirmar el acceso. En algunas empresas un responsable de sistemas debe autorizar la aplicación una sola vez para todo el equipo.",
    sessionNote:
      "Tu sesión quedará guardada en este navegador. Puedes cerrarla cuando quieras desde el menú lateral.",
    continue: "Continuar con Microsoft",
    adminHint: "Si algo falla, avisa a tu administrador de TI.",
    unavailableHint:
      "Tu administrador debe configurar la aplicación Microsoft (AUTH_BASE_URL, AZURE_AD_CLIENT_ID y AZURE_AD_CLIENT_SECRET).",
  },
  pat: {
    cardTitle: "Con un código de acceso",
    cardDescription:
      "Si tu equipo te dio un token o lo generaste tú en Azure DevOps.",
    panelTitle: "Entrar con código de acceso",
    intro:
      "Es un texto que creas en Azure DevOps y que copias aquí una sola vez. Funciona como una llave personal: no la compartas con nadie.",
    steps: [
      "Abre Azure DevOps y entra a tu perfil (arriba a la derecha).",
      "Busca «Tokens de acceso personal» o «Personal access tokens».",
      "Crea uno nuevo, ponle un nombre que recuerdes y elige cuánto tiempo será válido.",
      "Marca permisos para leer proyectos y elementos de trabajo.",
      "Copia el código en cuanto aparezca (solo se muestra una vez) y pégalo abajo.",
    ],
    expiryNote:
      "Cuando expire, tendrás que crear otro y volver a conectarte. Te conviene poner la fecha más corta que te sirva.",
    tokenHelpToggle: "¿Cómo obtengo el código de acceso?",
    urlLabel: "URL de Azure DevOps (opcional)",
    urlPlaceholder: "https://dev.azure.com/tu-organizacion/tu-proyecto/...",
    urlHint:
      "De la URL leemos organización (1.er segmento), proyecto (2.º) y equipo si estás en tablero o backlog. Ejemplo: dev.azure.com/technologyfactory/Plataforma Virtual - NARP/.../taskboard/Plataforma Virtual - Studia LMS V2/...",
    organizationLabel: "Organización",
    organizationPlaceholder: "technologyfactory",
    organizationHint:
      "Nombre corto de tu cuenta Azure DevOps. En la URL va justo después de dev.azure.com/.",
    projectLabel: "Proyecto",
    projectPlaceholder: "Plataforma Virtual - NARP",
    projectHint:
      "Nombre del proyecto en Azure DevOps. En la URL es el segmento que sigue a la organización.",
    teamLabel: "Equipo (opcional)",
    teamPlaceholder: "Plataforma Virtual - Studia LMS V2",
    teamHint:
      "Nombre del equipo en Azure DevOps. Si pegas una URL de tablero o sprint, lo detectamos automáticamente y lo usaremos en los filtros.",
    tokenLabel: "Código de acceso",
    tokenPlaceholder: "Pega aquí tu código",
    connect: "Conectar",
    connecting: "Conectando…",
    unavailableHint:
      "Tu administrador debe configurar la sesión del servidor (IRON_SESSION_PASSWORD, mínimo 32 caracteres).",
  },
  unavailable: {
    setup: {
      title: "Inicio de sesión no configurado",
      intro:
        "El administrador debe completar la configuración del servidor antes de que puedas conectarte desde aquí.",
      oauthHint:
        "Para Microsoft: define AUTH_BASE_URL, AZURE_AD_CLIENT_ID y AZURE_AD_CLIENT_SECRET.",
      patHint:
        "Para código de acceso: define IRON_SESSION_PASSWORD (mínimo 32 caracteres).",
      bothHint:
        "Recomendado: AZDO_AUTH_METHOD=both para elegir cuenta Microsoft o código de acceso.",
    },
  },
} as const;
