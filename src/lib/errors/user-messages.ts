/** Mensajes para mostrar en UI y respuestas API (sin detalles técnicos). */
export const USER_MESSAGES = {
  persistenceUnavailable:
    "El servicio de cuentas no está disponible en este momento. Inténtalo más tarde o contacta al administrador.",
  sessionUnavailable:
    "No pudimos iniciar tu sesión de forma segura. Inténtalo de nuevo en unos minutos.",
  authUnavailable:
    "El inicio de sesión no está disponible ahora. Vuelve a intentarlo más tarde.",
  microsoftUnavailable:
    "El inicio con Microsoft no está disponible en este entorno.",
  accountDisabled:
    "Tu cuenta está deshabilitada. Pide al administrador que la habilite para poder iniciar sesión.",
  invalidCredentials: "Usuario o contraseña incorrectos.",
  invalidForm: "Revisa los datos del formulario e inténtalo de nuevo.",
  invalidJsonBody: "No pudimos leer los datos enviados. Inténtalo de nuevo.",
  invalidWorkItemId: "El elemento de trabajo no es válido.",
  invalidPayload: "Los datos enviados no son válidos.",
  genericRetry: "Algo salió mal. Inténtalo de nuevo en unos segundos.",
  notConnected:
    "No hay conexión con Azure DevOps. Inicia sesión para continuar.",
  copilotInterpret:
    "No pudimos interpretar tu mensaje ahora. Inténtalo de nuevo.",
  copilotNoToolCall:
    "No pudimos procesar tu mensaje. Inténtalo de nuevo.",
  copilotInvalidArgs:
    "Algo salió mal al procesar tu mensaje. Inténtalo de nuevo.",
  copilotSchemaInvalid:
    "La IA devolvió una respuesta con formato inesperado. Inténtalo de nuevo.",
  copilotUnknownTool:
    "La IA usó una herramienta desconocida. Inténtalo de nuevo o reformula tu mensaje.",
  copilotNotConfigured:
    "El asistente no está configurado en este entorno. Usa el formulario manual para registrar tiempo.",
  saveFailed: "No pudimos guardar los cambios. Inténtalo de nuevo.",
  loadFailed: "No pudimos cargar la información. Actualiza la página e inténtalo de nuevo.",
  workItemUpdateFailed: "No pudimos actualizar el elemento de trabajo.",
  workItemDeleteFailed: "No pudimos eliminar el elemento de trabajo.",
  taskCreateFailed: "No pudimos crear la tarea en Azure DevOps.",
  profileSyncFailed: "No pudimos actualizar tu perfil. Inténtalo de nuevo.",
  settingsLoadFailed: "No pudimos cargar la configuración del proyecto.",
  settingsSaveFailed: "No pudimos guardar la configuración.",
  settingsRefreshFailed:
    "No pudimos actualizar la configuración desde Azure DevOps.",
  settingsTestFailed: "No pudimos probar la configuración.",
  sprintLoadFailed: "No pudimos cargar los datos del sprint.",
  timeLogPbisLoadFailed: "No pudimos cargar las historias del sprint.",
  permissionsInsufficient:
    "No tienes permisos suficientes para hacer este cambio en Azure DevOps.",
  workingDateRequired:
    "Azure DevOps necesita la fecha de trabajo para este cambio.",
  tooManyRequests:
    "Estás haciendo muchas solicitudes al asistente. Espera unos segundos e inténtalo de nuevo.",
  completedWorkRequired:
    "Azure DevOps necesita el trabajo completado para este cambio.",
  startDateRequired:
    "Azure DevOps necesita la fecha de inicio para este cambio.",
  targetDateRequired:
    "Azure DevOps necesita la fecha objetivo para este cambio.",
  responsablesRequired:
    "Completa los responsables requeridos antes de cambiar el estado.",
  responsableMissingField: ({
    roleLabel,
    fieldRef,
    fieldLabel,
    envKey,
  }: {
    roleLabel: string;
    fieldRef: string;
    fieldLabel?: string;
    envKey: string;
  }) =>
    `El proyecto requiere ${roleLabel} (ReferenceName: ${fieldRef}${
      fieldLabel ? ` — etiqueta: "${fieldLabel}"` : ""
    }) que la plataforma no pudo identificar automáticamente. Configura ${envKey} en .env.local con ese Reference Name.`,
  goToSettingsHint: "Ve a Configuración → Proceso para ajustarlo.",
  fieldConfigRequired: (field: string) =>
    `El proyecto requiere el campo '${field}'. Ve a Configuración → Proceso para configurarlo.`,
  attachmentUploadFailed: "No se pudo subir la imagen a Azure DevOps.",
} as const;
