import { format, getDay, subDays, parseISO, isValid } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";

const DEFAULT_TZ = "Europe/London";

/**
 * Week runs Saturday → Friday. `week_of` is always the Saturday that starts the period.
 * e.g. Sat 14 Jun … Fri 20 Jun → week_of = 2025-06-14
 */
export function getWeekOfSaturday(
  date: Date = new Date(),
  timezone: string = DEFAULT_TZ
): string {
  const zoned = toZonedTime(date, timezone);
  // getDay: 0=Sun … 6=Sat → days since last Saturday
  const day = getDay(zoned);
  const daysSinceSaturday = (day + 1) % 7;
  const saturday = subDays(zoned, daysSinceSaturday);
  return format(saturday, "yyyy-MM-dd");
}

/** Weekday in user's timezone: 0=Sun … 6=Sat */
export function getWeekdayInTimezone(
  date: Date = new Date(),
  timezone: string = DEFAULT_TZ
): number {
  const zoned = toZonedTime(date, timezone);
  return getDay(zoned);
}

export function isReminderDay(
  date: Date = new Date(),
  timezone: string = DEFAULT_TZ,
  reminderWeekday: number = 6
): boolean {
  return getWeekdayInTimezone(date, timezone) === reminderWeekday;
}

export function formatWeekOf(
  weekOf: string,
  pattern: string = "d MMM yyyy"
): string {
  const d = parseISO(weekOf);
  if (!isValid(d)) return weekOf;
  return format(d, pattern);
}

export function todayLabel(
  timezone: string = DEFAULT_TZ,
  pattern: string = "EEEE, d MMMM yyyy"
): string {
  return formatInTimeZone(new Date(), timezone, pattern);
}

export { DEFAULT_TZ };
