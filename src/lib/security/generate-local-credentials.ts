import "server-only";

import { randomBytes } from "node:crypto";

const USERNAME_PREFIX = "tp_";
const USERNAME_RANDOM_LENGTH = 10;
const PASSWORD_LENGTH = 24;

const USERNAME_ALPHABET =
  "abcdefghijklmnopqrstuvwxyz0123456789";
const PASSWORD_ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*-_";

function randomFromAlphabet(length: number, alphabet: string): string {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += alphabet[bytes[i]! % alphabet.length];
  }
  return result;
}

export type GeneratedLocalCredentials = {
  username: string;
  password: string;
};

/** Credenciales TaskPilot mostradas una sola vez tras registro PAT. */
export function generateLocalCredentials(): GeneratedLocalCredentials {
  return {
    username: `${USERNAME_PREFIX}${randomFromAlphabet(USERNAME_RANDOM_LENGTH, USERNAME_ALPHABET)}`,
    password: randomFromAlphabet(PASSWORD_LENGTH, PASSWORD_ALPHABET),
  };
}
