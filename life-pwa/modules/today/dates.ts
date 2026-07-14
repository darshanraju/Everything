import {
  eachDayOfInterval,
  endOfDay,
  format,
  startOfDay,
  subDays,
} from "date-fns";
import type { DayScore } from "@/modules/today/types";

export function dateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function eachLocalDay(from: Date, to: Date): Date[] {
  return eachDayOfInterval({
    start: startOfDay(from),
    end: startOfDay(to),
  });
}

export function emptyScores(from: Date, to: Date): DayScore[] {
  return eachLocalDay(from, to).map((d) => ({
    date: dateKey(d),
    expected: 0,
    completed: 0,
  }));
}

export function windowFromDaysBack(daysBack: number, end = new Date()): {
  from: Date;
  to: Date;
} {
  const to = startOfDay(end);
  const from = startOfDay(subDays(to, daysBack - 1));
  return { from, to };
}

export function dayBounds(d: Date): { start: string; end: string } {
  return {
    start: startOfDay(d).toISOString(),
    end: endOfDay(d).toISOString(),
  };
}
