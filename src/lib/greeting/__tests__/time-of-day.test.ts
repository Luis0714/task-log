import { describe, expect, it } from "vitest";

import { formatTimeGreeting, greetingForHour } from "@/lib/greeting/time-of-day";

const ZONE = "America/Bogota";

describe("greetingForHour", () => {
  it("saluda según la franja del día", () => {
    expect(greetingForHour(5)).toBe("Buenos días");
    expect(greetingForHour(11)).toBe("Buenos días");
    expect(greetingForHour(12)).toBe("Buenas tardes");
    expect(greetingForHour(18)).toBe("Buenas tardes");
    expect(greetingForHour(19)).toBe("Buenas noches");
    expect(greetingForHour(4)).toBe("Buenas noches");
  });
});

describe("formatTimeGreeting", () => {
  it("usa el primer nombre y la hora de Bogotá", () => {
    expect(formatTimeGreeting("Luis Martínez", new Date("2026-10-23T13:00:00.000Z"), ZONE)).toBe(
      "Buenos días, Luis!",
    );
    expect(formatTimeGreeting("Luis Martínez", new Date("2026-10-23T17:30:00.000Z"), ZONE)).toBe(
      "Buenas tardes, Luis!",
    );
    expect(formatTimeGreeting("Luis Martínez", new Date("2026-10-24T01:00:00.000Z"), ZONE)).toBe(
      "Buenas noches, Luis!",
    );
  });

  it("omite el nombre cuando es un marcador de posición", () => {
    expect(formatTimeGreeting("Hola", new Date("2026-10-23T13:00:00.000Z"), ZONE)).toBe(
      "Buenos días!",
    );
    expect(formatTimeGreeting("  ", new Date("2026-10-23T13:00:00.000Z"), ZONE)).toBe(
      "Buenos días!",
    );
  });
});
