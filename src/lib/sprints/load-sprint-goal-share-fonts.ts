export const SPRINT_GOAL_SHARE_FONT_FAMILY = "Inter";

export type SprintGoalShareFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

let fontsPromise: Promise<SprintGoalShareFont[]> | null = null;

async function loadGoogleFont(weight: 400 | 700): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&display=swap`,
    {
      headers: {
        // Fuerza respuesta con TTF/OTF compatible con Satori (no WOFF2).
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    },
  ).then((response) => response.text());

  const match = css.match(
    /src:\surl\(([^)]+)\)\sformat\('(?:opentype|truetype)'\)/,
  );

  if (!match?.[1]) {
    throw new Error("No se pudo resolver la fuente Inter para la imagen del sprint.");
  }

  return fetch(match[1]).then((response) => {
    if (!response.ok) {
      throw new Error("No se pudo descargar la fuente Inter para la imagen del sprint.");
    }
    return response.arrayBuffer();
  });
}

export function loadSprintGoalShareFonts(): Promise<SprintGoalShareFont[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([loadGoogleFont(400), loadGoogleFont(700)]).then(
      ([regular, bold]) => [
        {
          name: SPRINT_GOAL_SHARE_FONT_FAMILY,
          data: regular,
          weight: 400,
          style: "normal",
        },
        {
          name: SPRINT_GOAL_SHARE_FONT_FAMILY,
          data: bold,
          weight: 700,
          style: "normal",
        },
      ],
    );
  }

  return fontsPromise;
}
