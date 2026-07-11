import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { sileo, type SileoOptions, type SileoPosition } from "sileo";

// ---------------------------------------------------------------------------
// Tipos públicos (agnósticos de sileo)
// ---------------------------------------------------------------------------

export type AppToastAction = {
  label: string;
  onClick: () => void;
};

export type AppToastPosition = SileoPosition;

export type AppToastPromiseMessage = {
  title: string;
  description?: string;
};

export type AppToastOptions = {
  /** Línea secundaria debajo del título. */
  description?: string;
  /** Botón de acción opcional. */
  action?: AppToastAction;
  /** Duración en ms. `null` → toast pegado. Default: DEFAULT_DURATION_MS. */
  duration?: number | null;
  /** Override de posición por toast (si no, usa la del `<Toaster />`). */
  position?: AppToastPosition;
};

/** @deprecated usar `AppToastOptions`. */
export type ToastOptions = AppToastOptions;

// ---------------------------------------------------------------------------
// Constantes y helpers internos
// ---------------------------------------------------------------------------

const DEFAULT_DURATION_MS = 4_000;

const ICON_CLASS = "size-4";

function toSileoOptions(options?: AppToastOptions): SileoOptions {
  const out: SileoOptions = {
    duration: options?.duration ?? DEFAULT_DURATION_MS,
  };
  if (options?.position !== undefined) out.position = options.position;
  if (options?.description !== undefined) out.description = options.description;
  if (options?.action) {
    out.button = {
      title: options.action.label,
      onClick: options.action.onClick,
    };
  }
  return out;
}

function titleAndDesc(
  message: string,
  options?: AppToastOptions,
): Pick<SileoOptions, "title" | "description"> {
  return {
    title: message,
    ...(options?.description !== undefined
      ? { description: options.description }
      : {}),
  };
}

function toSileoPromise(msg: AppToastPromiseMessage): SileoOptions {
  const out: SileoOptions = { title: msg.title };
  if (msg.description !== undefined) out.description = msg.description;
  return out;
}

function formatError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return "Ocurrió un error inesperado.";
}

// ---------------------------------------------------------------------------
// appToast — superficie pública
// ---------------------------------------------------------------------------

export const appToast = {
  message(message: string, options?: AppToastOptions) {
    return sileo.show({
      ...titleAndDesc(message, options),
      ...toSileoOptions(options),
      icon: <InfoIcon className={ICON_CLASS} />,
    });
  },

  success(message: string, options?: AppToastOptions) {
    return sileo.success({
      ...titleAndDesc(message, options),
      ...toSileoOptions(options),
      icon: <CircleCheckIcon className={ICON_CLASS} />,
    });
  },

  error(message: string, options?: AppToastOptions) {
    return sileo.error({
      ...titleAndDesc(message, options),
      ...toSileoOptions(options),
      icon: <OctagonXIcon className={ICON_CLASS} />,
    });
  },

  info(message: string, options?: AppToastOptions) {
    return sileo.info({
      ...titleAndDesc(message, options),
      ...toSileoOptions(options),
      icon: <InfoIcon className={ICON_CLASS} />,
    });
  },

  warning(message: string, options?: AppToastOptions) {
    return sileo.warning({
      ...titleAndDesc(message, options),
      ...toSileoOptions(options),
      icon: <TriangleAlertIcon className={ICON_CLASS} />,
    });
  },

  /**
   * Toast persistente (sin auto-dismiss). El caller debe llamar a
   * `dismiss(id)` cuando la operación termine.
   */
  loading(message: string, options?: AppToastOptions) {
    return sileo.show({
      ...titleAndDesc(message, options),
      duration: null,
      icon: <Loader2Icon className={`${ICON_CLASS} animate-spin`} />,
    });
  },

  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: AppToastPromiseMessage;
      success:
        | AppToastPromiseMessage
        | ((data: T) => AppToastPromiseMessage);
      error?:
        | AppToastPromiseMessage
        | ((error: unknown) => AppToastPromiseMessage);
    },
    options?: AppToastOptions,
  ) {
    const position = options?.position;
    // Extraemos a consts para que TS mantenga el estrechamiento de tipo
    // (`typeof … === "function"`) dentro de los closures de éxito/error.
    const { loading, success, error } = messages;
    return sileo.promise(promise, {
      loading: {
        ...toSileoPromise(loading),
        icon: <Loader2Icon className={`${ICON_CLASS} animate-spin`} />,
      },
      success:
        typeof success === "function"
          ? (data: T) => ({
              ...toSileoPromise(success(data)),
              icon: <CircleCheckIcon className={ICON_CLASS} />,
            })
          : {
              ...toSileoPromise(success),
              icon: <CircleCheckIcon className={ICON_CLASS} />,
            },
      error:
        error === undefined
          ? (err: unknown) => ({
              title: formatError(err) || "Ocurrió un error inesperado.",
              icon: <OctagonXIcon className={ICON_CLASS} />,
            })
          : typeof error === "function"
            ? (err: unknown) => ({
                ...toSileoPromise(error(err)),
                icon: <OctagonXIcon className={ICON_CLASS} />,
              })
            : {
                ...toSileoPromise(error),
                icon: <OctagonXIcon className={ICON_CLASS} />,
              },
      ...(position ? { position } : {}),
    });
  },

  fromError(
    error: unknown,
    fallback = "Ocurrió un error inesperado.",
    options?: AppToastOptions,
  ) {
    const message = formatError(error) || fallback;
    return sileo.error({
      ...titleAndDesc(message, options),
      ...toSileoOptions(options),
      icon: <OctagonXIcon className={ICON_CLASS} />,
    });
  },

  dismiss(toastId?: string) {
    if (toastId === undefined) {
      sileo.clear();
      return;
    }
    sileo.dismiss(toastId);
  },
};