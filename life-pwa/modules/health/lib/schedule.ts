import { WEEKDAYS } from "@/lib/schema";

/** Local weekday: 0=Monday … 6=Sunday (matches fitness weekly_plan). */
export function localWeekday(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function normalizeWeekdays(
  weekdays: number[] | null | undefined
): number[] {
  if (!weekdays?.length) return [];
  const set = new Set<number>();
  for (const w of weekdays) {
    const n = Number(w);
    if (!Number.isNaN(n) && n >= 0 && n <= 6) set.add(n);
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * Whether a protocol should appear on Today / count for SLA on `date`.
 * daily & eod → always; weekly/custom → schedule_weekdays (empty = always).
 */
export function isProtocolDueOn(
  p: {
    frequency: string;
    schedule_weekdays?: number[] | null;
  },
  date: Date
): boolean {
  const freq = p.frequency || "daily";
  if (freq === "daily" || freq === "eod") return true;
  if (freq !== "weekly" && freq !== "custom") return true;
  const days = normalizeWeekdays(p.schedule_weekdays);
  if (days.length === 0) return true;
  return days.includes(localWeekday(date));
}

/** "Monday" or "Mon, Wed, Fri" */
export function formatScheduleDays(
  weekdays: number[] | null | undefined,
  opts?: { short?: boolean }
): string {
  const days = normalizeWeekdays(weekdays);
  if (days.length === 0) return "";
  const short = opts?.short ?? days.length > 1;
  return days
    .map((w) => {
      const row = WEEKDAYS.find((d) => d.value === w);
      return short ? (row?.short ?? String(w)) : (row?.label ?? String(w));
    })
    .join(", ");
}

/** Frequency label for lists: "weekly · Monday" / "custom · Mon, Wed" */
export function formatProtocolFrequency(p: {
  frequency: string;
  frequency_note?: string | null;
  schedule_weekdays?: number[] | null;
}): string {
  const freq = p.frequency || "daily";
  const days = formatScheduleDays(p.schedule_weekdays, {
    short: freq === "custom",
  });
  if ((freq === "weekly" || freq === "custom") && days) {
    return `${freq} · ${days}`;
  }
  if (p.frequency_note?.trim()) {
    return `${freq} (${p.frequency_note.trim()})`;
  }
  return freq;
}

export function normalizeScheduleForSave(
  frequency: string,
  weekdays: number[] | null | undefined
): number[] | null {
  if (frequency !== "weekly" && frequency !== "custom") return null;
  const days = normalizeWeekdays(weekdays);
  if (days.length === 0) return null;
  if (frequency === "weekly") return [days[0]];
  return days;
}
