export type SpanishDayPeriod = "dias" | "tardes" | "noches";

const GREETING_BY_PERIOD: Record<SpanishDayPeriod, string> = {
  dias: "buenos días",
  tardes: "buenas tardes",
  noches: "buenas noches",
};

const DAY_START_HOUR = 5;
const AFTERNOON_START_HOUR = 12;
const NIGHT_START_HOUR = 19;

export function resolveSpanishDayPeriod(now: Date): SpanishDayPeriod {
  const hour = now.getHours();
  if (hour >= DAY_START_HOUR && hour < AFTERNOON_START_HOUR) return "dias";
  if (hour >= AFTERNOON_START_HOUR && hour < NIGHT_START_HOUR) return "tardes";
  return "noches";
}

export function buildPullRequestHelpMessage(input: {
  link: string;
  now?: Date;
}): string {
  const greeting = GREETING_BY_PERIOD[resolveSpanishDayPeriod(input.now ?? new Date())];
  return `Hola, muy ${greeting}. Cuando puedas, ¿será que me puedes ayudar con este PR: ${input.link}? ¡Muchas gracias!!`;
}
