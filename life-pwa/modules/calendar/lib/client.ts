import { format, parseISO } from "date-fns";
import { dayBounds } from "@/modules/today/dates";
import type { TodayItem } from "@/modules/today/types";
import type { CalendarEventDto } from "@/modules/calendar/lib/server";

function formatTimeRange(ev: CalendarEventDto): string {
  if (ev.allDay) return "All day";

  try {
    const start = parseISO(ev.start);
    const end = parseISO(ev.end);
    const startLabel = format(start, "h:mm a");
    const endLabel = format(end, "h:mm a");
    return `${startLabel} – ${endLabel}`;
  } catch {
    return "Scheduled";
  }
}

function sortKey(ev: CalendarEventDto): number {
  if (ev.allDay) {
    // All-day first among calendar items (start of day)
    return parseISO(ev.start.includes("T") ? ev.start : `${ev.start}T00:00:00`)
      .getTime();
  }
  try {
    return parseISO(ev.start).getTime();
  } catch {
    return 0;
  }
}

function toTodayItem(ev: CalendarEventDto, index: number): TodayItem {
  const time = formatTimeRange(ev);
  const subtitle = ev.location ? `${time} · ${ev.location}` : time;

  return {
    id: `calendar:event:${ev.id}`,
    sourceKey: "calendar",
    title: ev.title,
    subtitle,
    href: ev.htmlLink,
    status: "pending",
    sortOrder: sortKey(ev) || index,
    completeAction: "none",
    meta: {
      eventId: ev.id,
      start: ev.start,
      end: ev.end,
      allDay: ev.allDay,
    },
  };
}

/**
 * Fetch today's calendar events and map to Today items.
 * Never throws — returns [] on any failure so Yours still loads.
 */
export async function fetchTodayCalendarItems(
  date: Date
): Promise<TodayItem[]> {
  try {
    const { start: timeMin, end: timeMax } = dayBounds(date);
    const params = new URLSearchParams({ timeMin, timeMax });
    const res = await fetch(`/api/calendar/today?${params}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];

    const json = (await res.json()) as {
      events?: CalendarEventDto[];
    };
    const events = json.events ?? [];
    return events
      .map((ev, i) => toTodayItem(ev, i))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch {
    return [];
  }
}
