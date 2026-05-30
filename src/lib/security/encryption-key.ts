import "server-only";

const MIN_KEY_BYTES = 32;

function decodeEncryptionKey(raw: string): Buffer {
  const trimmed = raw.trim();

  try {
    const fromBase64 = Buffer.from(trimmed, "base64");
    if (fromBase64.length >= MIN_KEY_BYTES) {
      return fromBase64.subarray(0, MIN_KEY_BYTES);
    }
  } catch {
    // Intentar hex a continuación.
  }

  if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length >= MIN_KEY_BYTES * 2) {
    return Buffer.from(trimmed.slice(0, MIN_KEY_BYTES * 2), "hex");
  }

  const utf8 = Buffer.from(trimmed, "utf8");
  if (utf8.length >= MIN_KEY_BYTES) {
    return utf8.subarray(0, MIN_KEY_BYTES);
  }

  throw new Error(
    "ENCRYPTION_KEY debe ser base64 o hex de al menos 32 bytes, o una cadena UTF-8 de 32+ caracteres.",
  );
}

export function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error(
      "ENCRYPTION_KEY no está definida. Genera una clave aleatoria de 32+ bytes.",
    );
  }
  return decodeEncryptionKey(raw);
}

export function isEncryptionConfigured(): boolean {
  try {
    if (!process.env.ENCRYPTION_KEY?.trim()) return false;
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}
