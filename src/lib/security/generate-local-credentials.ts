import "server-only";

import { randomInt } from "node:crypto";
import generator from "generate-password";

import { getTaskPilotAccountEmailDomain } from "@/lib/schemas/taskpilot-email";

const LOCAL_PART_LENGTH = 12;
const LOCAL_PART_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const TASKPILOT_PASSWORD_LENGTH = 24;

function generateEmailLocalPart(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += LOCAL_PART_ALPHABET[randomInt(LOCAL_PART_ALPHABET.length)]!;
  }
  return result;
}

/** Contraseña aleatoria con `generate-password` (crypto de Node, sin sesgo por módulo). */
function generateTaskPilotPassword(): string {
  const password = generator.generate({
    length: TASKPILOT_PASSWORD_LENGTH,
    numbers: true,
    lowercase: true,
    uppercase: true,
    symbols: true,
    strict: true,
    excludeSimilarCharacters: true,
  });

  if (!password) {
    throw new Error("No se pudo generar la contraseña.");
  }

  return password;
}

export type GeneratedLocalCredentials = {
  email: string;
  password: string;
};

/** Correo y contraseña TaskPilot mostrados una sola vez tras registro PAT. */
export function generateLocalCredentials(): GeneratedLocalCredentials {
  const domain = getTaskPilotAccountEmailDomain();

  return {
    email: `${generateEmailLocalPart(LOCAL_PART_LENGTH)}@${domain}`,
    password: generateTaskPilotPassword(),
  };
}
