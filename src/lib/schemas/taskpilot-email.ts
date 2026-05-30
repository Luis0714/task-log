import { z } from "zod";

const DEFAULT_ACCOUNT_EMAIL_DOMAIN = "cuenta.taskpilot.app";

export function getTaskPilotAccountEmailDomain(): string {
  const fromEnv = process.env.TASKPILOT_ACCOUNT_EMAIL_DOMAIN?.trim();
  return fromEnv && fromEnv.length > 0
    ? fromEnv.toLowerCase()
    : DEFAULT_ACCOUNT_EMAIL_DOMAIN;
}

/** Correo de inicio de sesión TaskPilot (local): trim + minúsculas. */
export function normalizeTaskPilotEmail(value: string): string {
  return value.trim().toLowerCase();
}

export const taskPilotEmailSchema = z
  .string()
  .trim()
  .min(1, "Indica tu correo.")
  .email("Indica un correo válido.")
  .transform(normalizeTaskPilotEmail);
