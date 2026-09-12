import { timingSafeEqual } from "node:crypto";

/**
 * Compara dos strings en tiempo constante (padding a la misma longitud).
 * Evita filtrar la longitud de la contraseña por timing.
 */
export function timingSafeStringEqual(left: string, right: string): boolean {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);
  const size = Math.max(leftBuf.length, rightBuf.length, 1);
  const paddedLeft = Buffer.alloc(size);
  const paddedRight = Buffer.alloc(size);
  leftBuf.copy(paddedLeft);
  rightBuf.copy(paddedRight);
  return timingSafeEqual(paddedLeft, paddedRight) && leftBuf.length === rightBuf.length;
}
