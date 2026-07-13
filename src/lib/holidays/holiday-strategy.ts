export type Holiday = {
  date: string;
  name: string;
};

export interface HolidayStrategy {
  isHoliday(date: Date): Promise<boolean>;
  getHoliday(date: Date): Promise<Holiday | null>;
  getHolidays(year: number): Promise<Holiday[]>;
}