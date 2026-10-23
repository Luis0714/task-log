import { formatTimeGreeting } from "@/lib/greeting/time-of-day";

const DEFAULT_TIME_ZONE = "America/Bogota";

export type TimeGreetingProps = {
  name: string;
  at?: Date;
  timeZone?: string;
};

export function TimeGreeting({
  name,
  at,
  timeZone = DEFAULT_TIME_ZONE,
}: TimeGreetingProps) {
  return formatTimeGreeting(name, at ?? new Date(), timeZone);
}
