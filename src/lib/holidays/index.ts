import "server-only";

import { HolidayService } from "@/lib/holidays/holiday-service";
import { HolidayStrategyFactory } from "@/lib/holidays/holiday-strategy-factory";

export type { Holiday, HolidayStrategy } from "@/lib/holidays/holiday-strategy";
export {
  HolidayStrategyFactory,
  resolveActiveProvider,
  type HolidayProviderName,
} from "@/lib/holidays/holiday-strategy-factory";
export { HolidayService } from "@/lib/holidays/holiday-service";
export { DateHolidaysStrategy } from "@/lib/holidays/date-holidays-strategy";
export { HolidayApiStrategy } from "@/lib/holidays/holiday-api-strategy";

let serviceInstance: HolidayService | null = null;

function getHolidayService(): HolidayService {
  if (!serviceInstance) {
    serviceInstance = new HolidayService(HolidayStrategyFactory.create());
  }
  return serviceInstance;
}

export function loadColombianHolidaysForRange(
  fromIso: string,
  toIso: string,
): Promise<import("@/lib/holidays/holiday-strategy").Holiday[]> {
  return getHolidayService().loadColombianHolidaysForRange(fromIso, toIso);
}

export function resetHolidayServiceForTesting(): void {
  serviceInstance = null;
}