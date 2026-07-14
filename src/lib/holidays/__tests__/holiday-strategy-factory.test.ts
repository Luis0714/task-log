import { afterEach, describe, expect, it } from "vitest";

import { DateHolidaysStrategy } from "@/lib/holidays/date-holidays-strategy";
import { HolidayApiStrategy } from "@/lib/holidays/holiday-api-strategy";
import {
  HolidayStrategyFactory,
  resolveActiveProvider,
} from "@/lib/holidays/holiday-strategy-factory";

describe("HolidayStrategyFactory", () => {
  const originalProvider = process.env.HOLIDAY_PROVIDER;

  afterEach(() => {
    if (originalProvider === undefined) delete process.env.HOLIDAY_PROVIDER;
    else process.env.HOLIDAY_PROVIDER = originalProvider;
  });

  it("por defecto crea DateHolidaysStrategy", () => {
    delete process.env.HOLIDAY_PROVIDER;
    expect(resolveActiveProvider()).toBe("library");
    expect(HolidayStrategyFactory.create()).toBeInstanceOf(DateHolidaysStrategy);
  });

  it("HOLIDAY_PROVIDER=api crea HolidayApiStrategy", () => {
    process.env.HOLIDAY_PROVIDER = "api";
    expect(resolveActiveProvider()).toBe("api");
    expect(HolidayStrategyFactory.create()).toBeInstanceOf(HolidayApiStrategy);
  });

  it("acepta mayúsculas, minúsculas y espacios", () => {
    process.env.HOLIDAY_PROVIDER = "  API  ";
    expect(resolveActiveProvider()).toBe("api");
  });

  it("valor desconocido cae al default", () => {
    process.env.HOLIDAY_PROVIDER = "otra-cosa";
    expect(resolveActiveProvider()).toBe("library");
    expect(HolidayStrategyFactory.create()).toBeInstanceOf(DateHolidaysStrategy);
  });
});