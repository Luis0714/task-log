import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const SPRINT_GOAL_SHARE_FONT_FAMILY = "Inter";

const INTER_REGULAR_PATH = join(
  process.cwd(),
  "public/fonts/inter/Inter-Regular.ttf",
);

const INTER_BOLD_PATH = join(
  process.cwd(),
  "public/fonts/inter/Inter-Bold.ttf",
);

export type SprintGoalShareFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return Uint8Array.from(buffer).buffer;
}

let fontsPromise: Promise<SprintGoalShareFont[]> | null = null;

export function loadSprintGoalShareFonts(): Promise<SprintGoalShareFont[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      readFile(INTER_REGULAR_PATH),
      readFile(INTER_BOLD_PATH),
    ]).then(([regular, bold]) => [
      {
        name: SPRINT_GOAL_SHARE_FONT_FAMILY,
        data: toArrayBuffer(regular),
        weight: 400,
        style: "normal",
      },
      {
        name: SPRINT_GOAL_SHARE_FONT_FAMILY,
        data: toArrayBuffer(bold),
        weight: 700,
        style: "normal",
      },
    ]);
  }

  return fontsPromise;
}
