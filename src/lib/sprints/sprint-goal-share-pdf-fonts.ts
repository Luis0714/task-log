import { join } from "node:path";

import { Font } from "@react-pdf/renderer";

import { SPRINT_GOAL_SHARE_FONT_FAMILY } from "@/lib/sprints/load-sprint-goal-share-fonts";

let fontsRegistered = false;

export function registerSprintGoalSharePdfFonts(): void {
  if (fontsRegistered) return;

  Font.register({
    family: SPRINT_GOAL_SHARE_FONT_FAMILY,
    fonts: [
      {
        src: join(process.cwd(), "public/fonts/inter/Inter-Regular.ttf"),
        fontWeight: 400,
      },
      {
        src: join(process.cwd(), "public/fonts/inter/Inter-Bold.ttf"),
        fontWeight: 700,
      },
    ],
  });

  fontsRegistered = true;
}
