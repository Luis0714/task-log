import { describe, expect, it } from "vitest";

import {
  buildPullRequestHelpMessage,
  resolveSpanishDayPeriod,
} from "@/lib/pull-requests/help-message";

function atHour(hour: number): Date {
  return new Date(2026, 8, 11, hour, 0, 0);
}

describe("resolveSpanishDayPeriod", () => {
  it("uses días in the morning", () => {
    expect(resolveSpanishDayPeriod(atHour(5))).toBe("dias");
    expect(resolveSpanishDayPeriod(atHour(11))).toBe("dias");
  });

  it("uses tardes in the afternoon", () => {
    expect(resolveSpanishDayPeriod(atHour(12))).toBe("tardes");
    expect(resolveSpanishDayPeriod(atHour(18))).toBe("tardes");
  });

  it("uses noches at night and before dawn", () => {
    expect(resolveSpanishDayPeriod(atHour(19))).toBe("noches");
    expect(resolveSpanishDayPeriod(atHour(23))).toBe("noches");
    expect(resolveSpanishDayPeriod(atHour(0))).toBe("noches");
    expect(resolveSpanishDayPeriod(atHour(4))).toBe("noches");
  });
});

describe("buildPullRequestHelpMessage", () => {
  const link = "https://dev.azure.com/org/project/_git/repo/pullrequest/42";

  it("builds the morning Teams message", () => {
    expect(buildPullRequestHelpMessage({ link, now: atHour(9) })).toBe(
      `Hola, muy buenos días. Cuando puedas, ¿será que me puedes ayudar con este PR: ${link}? ¡Muchas gracias!!`,
    );
  });

  it("builds the afternoon Teams message", () => {
    expect(buildPullRequestHelpMessage({ link, now: atHour(15) })).toBe(
      `Hola, muy buenas tardes. Cuando puedas, ¿será que me puedes ayudar con este PR: ${link}? ¡Muchas gracias!!`,
    );
  });

  it("builds the night Teams message", () => {
    expect(buildPullRequestHelpMessage({ link, now: atHour(21) })).toBe(
      `Hola, muy buenas noches. Cuando puedas, ¿será que me puedes ayudar con este PR: ${link}? ¡Muchas gracias!!`,
    );
  });
});
