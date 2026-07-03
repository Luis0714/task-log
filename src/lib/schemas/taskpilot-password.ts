import { z } from "zod";

export const loginPasswordSchema = z
  .string()
  .min(1, "Indica tu contraseña.");

export const registerPasswordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres.");
