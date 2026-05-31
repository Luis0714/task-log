import { readFile } from "node:fs/promises";
import { join } from "node:path";

const SATOSHI_REGULAR_PATH = join(
  process.cwd(),
  "public/fonts/satoshi/Satoshi-Regular.woff2",
);

const SATOSHI_BOLD_PATH = join(
  process.cwd(),
  "public/fonts/satoshi/Satoshi-Bold.woff2",
);

export type SprintGoalShareFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

let fontsPromise: Promise<SprintGoalShareFont[]> | null = null;

export function loadSprintGoalShareFonts(): Promise<SprintGoalShareFont[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      readFile(SATOSHI_REGULAR_PATH),
      readFile(SATOSHI_BOLD_PATH),
    ]).then(([regular, bold]) => [
      {
        name: "Satoshi",
        data: regular.buffer.slice(
          regular.byteOffset,
          regular.byteOffset + regular.byteLength,
        ),
        weight: 400,
        style: "normal",
      },
      {
        name: "Satoshi",
        data: bold.buffer.slice(
          bold.byteOffset,
          bold.byteOffset + bold.byteLength,
        ),
        weight: 700,
        style: "normal",
      },
    ]);
  }

  return fontsPromise;
}
