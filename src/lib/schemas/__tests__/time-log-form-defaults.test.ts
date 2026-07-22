import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  TIME_LOG_TASK_STEP_DEFAULTS,
  createTimeLogFormDefaults,
} from "@/lib/schemas/time-log";

describe("createTimeLogFormDefaults", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("inicializa workingDate con la fecha actual del sistema (zona local)", () => {
    vi.setSystemTime(new Date(2026, 6, 22, 14, 30)); // 22 jul 2026 14:30 local.

    const defaults = createTimeLogFormDefaults("");

    expect(defaults.workingDate).toBe("2026-07-22");
  });

  it("inicializa workingTime con la hora actual del sistema (formato HH:mm)", () => {
    vi.setSystemTime(new Date(2026, 6, 22, 9, 5));

    const defaults = createTimeLogFormDefaults("");

    expect(defaults.workingTime).toBe("09:05");
  });

  it("inicializa workingDate con la fecha actual aunque se pase un sprintPath", () => {
    vi.setSystemTime(new Date(2026, 6, 22, 14, 30));

    const defaults = createTimeLogFormDefaults("", {
      sprintPath: "Sprint/Lejos",
    });

    expect(defaults.workingDate).toBe("2026-07-22");
  });
});

describe("TIME_LOG_TASK_STEP_DEFAULTS", () => {
  // El módulo captura la fecha/hora actual al importarlo, por lo que el
  // formato debe ser siempre `YYYY-MM-DD` para `workingDate` y `HH:mm` para
  // `workingTime`, sin importar el momento de la carga.
  it("inicializa workingDate y workingTime con el formato correcto (YYYY-MM-DD y HH:mm)", () => {
    expect(TIME_LOG_TASK_STEP_DEFAULTS.workingDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(TIME_LOG_TASK_STEP_DEFAULTS.workingTime).toMatch(/^\d{2}:\d{2}$/);
  });
});
