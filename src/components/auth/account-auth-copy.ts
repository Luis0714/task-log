const LOCAL_ACCOUNT_FIELDS = {
  emailLabel: "Correo TaskPilot",
  emailPlaceholder: "tu@correo.com",
  passwordLabel: "Contraseña",
} as const;

export const ACCOUNT_AUTH_COPY = {
  login: {
    title: "Iniciar sesión",
    description:
      "Entra con el correo y la contraseña de TaskPilot que elegiste al registrarte.",
    ...LOCAL_ACCOUNT_FIELDS,
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
      "Elige un correo y contraseña para TaskPilot y configura tu conexión con Azure DevOps.",
    ...LOCAL_ACCOUNT_FIELDS,
    emailHint: "Puede ser cualquier correo; lo usarás para entrar a TaskPilot.",
    passwordPlaceholder: "Mínimo 8 caracteres",
    submit: "Crear cuenta",
    submitting: "Creando cuenta…",
    hasAccount: "¿Ya tienes cuenta?",
    loginLink: "Iniciar sesión",
  },
  registerDisabled: {
    message:
      "Registro temporalmente deshabilitado. Por favor, inicia sesión con Microsoft.",
    action: "Ir a iniciar sesión",
  },
  persistenceUnavailable:
    "El servicio de cuentas no está disponible en este momento. Inténtalo más tarde o contacta al administrador.",
  patConnectHint:
    "Guardamos tu conexión con Azure DevOps de forma segura. Crea una cuenta o entra si ya la tienes.",
  patConnectRegister: "Crear cuenta",
  patConnectLogin: "Ya tengo cuenta",
} as const;
