export const ACCOUNT_AUTH_COPY = {
  login: {
    title: "Iniciar sesión",
    description:
      "Entra con el usuario y la contraseña de TaskPilot que recibiste al registrarte.",
    usernameLabel: "Usuario TaskPilot",
    usernamePlaceholder: "tp_…",
    passwordLabel: "Contraseña",
    passwordPlaceholder: "Tu contraseña",
    submit: "Entrar",
    submitting: "Entrando…",
    noAccount: "¿Primera vez aquí?",
    registerLink: "Crear cuenta",
    microsoftDivider: "o",
    microsoftButton: "Continuar con Microsoft",
  },
  register: {
    title: "Crear cuenta",
    description:
      "Configura tu conexión con Azure DevOps. Te daremos un usuario y contraseña de TaskPilot para futuros accesos.",
    submit: "Crear cuenta",
    submitting: "Creando cuenta…",
    hasAccount: "¿Ya tienes cuenta?",
    loginLink: "Iniciar sesión",
  },
  credentialsReveal: {
    title: "Guarda tus credenciales",
    description:
      "Son solo para entrar a TaskPilot. No son tu cuenta de Microsoft ni tu código de Azure DevOps.",
    usernameLabel: "Usuario",
    passwordLabel: "Contraseña",
    copyUsername: "Copiar usuario",
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
