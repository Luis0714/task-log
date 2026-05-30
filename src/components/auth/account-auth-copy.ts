export const ACCOUNT_AUTH_COPY = {
  login: {
    title: "Iniciar sesión",
    description:
      "Entra con el correo y la contraseña de TaskPilot que recibiste al registrarte.",
    emailLabel: "Correo TaskPilot",
    emailPlaceholder: "tu@correo.taskpilot",
    passwordLabel: "Contraseña",
    passwordPlaceholder: "Tu contraseña",
    submit: "Entrar",
    submitting: "Entrando…",
    noAccount: "¿Primera vez aquí?",
    registerLink: "Crear cuenta",
    microsoftDivider: "o",
    microsoftButton: "Continuar con Microsoft",
    microsoftHint:
      "Si aún no tienes cuenta, la crearemos al continuar con Microsoft.",
    microsoftAdminHint: "Si algo falla, avisa a tu administrador de TI.",
  },
  register: {
    title: "Crear cuenta",
    description:
      "Configura tu conexión con Azure DevOps. Te daremos un correo y contraseña de TaskPilot para futuros accesos.",
    submit: "Crear cuenta",
    submitting: "Creando cuenta…",
    hasAccount: "¿Ya tienes cuenta?",
    loginLink: "Iniciar sesión",
  },
  credentialsReveal: {
    title: "Guarda tus credenciales",
    description:
      "Son solo para entrar a TaskPilot. No son tu cuenta de Microsoft ni tu código de Azure DevOps.",
    emailLabel: "Correo TaskPilot",
    passwordLabel: "Contraseña",
    copyEmail: "Copiar correo",
    copyPassword: "Copiar contraseña",
    copied: "Copiado",
    warning:
      "No volverán a mostrarse. Si las pierdes, tendrás que volver a registrarte con un código de acceso válido.",
    continue: "Ir al inicio",
  },
  persistenceUnavailable:
    "El servicio de cuentas no está disponible en este momento. Inténtalo más tarde o contacta al administrador.",
  patConnectHint:
    "Guardamos tu conexión con Azure DevOps de forma segura. Crea una cuenta o entra si ya la tienes.",
  patConnectRegister: "Crear cuenta",
  patConnectLogin: "Ya tengo cuenta",
} as const;
