import type { ReactNode } from "react";
import { toast, type ExternalToast } from "sonner";

export type ToastOptions = ExternalToast;

const DEFAULT_DURATION_MS = 4_000;

function withDefaults(options?: ToastOptions): ToastOptions {
  return {
    duration: DEFAULT_DURATION_MS,
    ...options,
  };
}

function formatError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return "Ocurrió un error inesperado.";
}

export const appToast = {
  message(message: string, options?: ToastOptions) {
    return toast(message, withDefaults(options));
  },

  success(message: string, options?: ToastOptions) {
    return toast.success(message, withDefaults(options));
  },

  error(message: string, options?: ToastOptions) {
    return toast.error(message, withDefaults(options));
  },

  info(message: string, options?: ToastOptions) {
    return toast.info(message, withDefaults(options));
  },

  warning(message: ReactNode, options?: ToastOptions) {
    return toast.warning(message, withDefaults(options));
  },

  loading(message: string, options?: ToastOptions) {
    return toast.loading(message, options);
  },

  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error?: string | ((error: unknown) => string);
    },
    options?: ToastOptions,
  ) {
    return toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error ?? ((error) => formatError(error)),
      ...options,
    });
  },

  fromError(error: unknown, fallback = "Ocurrió un error inesperado.", options?: ToastOptions) {
    return toast.error(formatError(error) || fallback, withDefaults(options));
  },

  dismiss(toastId?: string | number) {
    toast.dismiss(toastId);
  },
};
