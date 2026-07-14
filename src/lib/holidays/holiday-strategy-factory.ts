import { DateHolidaysStrategy } from "@/lib/holidays/date-holidays-strategy";
import { HolidayApiStrategy } from "@/lib/holidays/holiday-api-strategy";
import type { HolidayStrategy } from "@/lib/holidays/holiday-strategy";

export type HolidayProviderName = "library" | "api";

export class HolidayStrategyFactory {
  static create(): HolidayStrategy {
    const provider = process.env.HOLIDAY_PROVIDER?.trim().toLowerCase();
    return provider === "api"
      ? new HolidayApiStrategy()
      : new DateHolidaysStrategy();
  }
}

export function resolveActiveProvider(): HolidayProviderName {
  const raw = process.env.HOLIDAY_PROVIDER?.trim().toLowerCase();
  return raw === "api" ? "api" : "library";
}