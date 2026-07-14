import type {
  DayScore,
  TodayContributor,
  TodayItem,
} from "@/modules/today/types";
import {
  listTasksForDate,
  toggleTodayTask,
} from "@/modules/manual/lib/api";
import { db } from "@/lib/supabase/client";
import { dateKey, eachLocalDay } from "@/modules/today/dates";
import { format } from "date-fns";

/**
 * Manual todos the user adds on Today.
 * Future modules do not go here — they get their own contributor file.
 */
export const manualTodayContributor: TodayContributor = {
  sourceKey: "manual",
  label: "Yours",
  enabled: true,

  async getItems(date: Date): Promise<TodayItem[]> {
    const tasks = await listTasksForDate(date);
    return tasks.map((t, index) => ({
      id: `manual:task:${t.id}`,
      sourceKey: "manual",
      title: t.title,
      subtitle: t.notes ?? undefined,
      status: t.is_done ? "done" : "pending",
      sortOrder: index,
      completeAction: "toggle" as const,
      meta: { taskId: t.id, isDone: t.is_done },
    }));
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
