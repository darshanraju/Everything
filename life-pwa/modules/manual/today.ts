import type {
  DayScore,
  TodayContributor,
  TodayItem,
} from "@/modules/today/types";
import {
  isTaskLink,
  listTasksForDate,
  toggleTodayTask,
} from "@/modules/manual/lib/api";
import { fetchTodayCalendarItems } from "@/modules/calendar/lib/client";
import { db } from "@/lib/supabase/client";
import { dateKey, eachLocalDay } from "@/modules/today/dates";
import { format } from "date-fns";

/**
 * Manual todos the user adds on Today, plus live Google Calendar events.
 * Future modules do not go here — they get their own contributor file.
 */
export const manualTodayContributor: TodayContributor = {
  sourceKey: "manual",
  label: "Yours",
  enabled: true,

  async getItems(date: Date): Promise<TodayItem[]> {
    const [tasks, calItems] = await Promise.all([
      listTasksForDate(date),
      fetchTodayCalendarItems(date),
    ]);
    const manualItems: TodayItem[] = tasks.map((t, index) => {
      const link = isTaskLink(t.notes) ? t.notes!.trim() : undefined;
      return {
        id: `manual:task:${t.id}`,
        sourceKey: "manual",
        title: t.title,
        // Non-URL notes show as subtitle; URLs open via href
        subtitle: t.notes && !link ? t.notes : link ? link : undefined,
        href: link,
        status: t.is_done ? "done" : "pending",
        // After calendar items; keep relative order
        sortOrder: 1_000_000 + index,
        completeAction: "toggle" as const,
        meta: { taskId: t.id, isDone: t.is_done },
      };
    });
    // Calendar first (chronological), then manual todos
    return [...calItems, ...manualItems];
  },

  async completeItem(item) {
    const taskId = item.meta?.taskId as string | undefined;
    if (!taskId) return;
    const nextDone = item.status !== "done";
    await toggleTodayTask(taskId, nextDone);
  },

  async getDayScores(from: Date, to: Date): Promise<DayScore[]> {
    const fromKey = dateKey(from);
    const toKey = dateKey(to);
    const { data, error } = await db()
      .from("today_tasks")
      .select("due_on, is_done")
      .gte("due_on", fromKey)
      .lte("due_on", toKey);
    if (error) throw error;

    const byDay = new Map<string, { expected: number; completed: number }>();
    for (const row of data ?? []) {
      const key = row.due_on as string;
      const cur = byDay.get(key) ?? { expected: 0, completed: 0 };
      cur.expected += 1;
      if (row.is_done) cur.completed += 1;
      byDay.set(key, cur);
    }

    return eachLocalDay(from, to).map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const cur = byDay.get(key);
      return {
        date: key,
        expected: cur?.expected ?? 0,
        completed: cur?.completed ?? 0,
      };
    });
  },
};
