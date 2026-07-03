import { z } from "zod";

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
