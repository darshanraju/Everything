import { createClient } from "@/lib/supabase/client";
import { SUPABASE_SCHEMA, type Task } from "@/lib/schema";
import {
  eachDayOfInterval,
  endOfDay,
  format,
  startOfDay,
  subDays,
  isSameDay,
  parseISO,
} from "date-fns";

function db() {
  return createClient().schema(SUPABASE_SCHEMA);
}

export async function listTasks(): Promise<Task[]> {
  const { data, error } = await db()
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Task[];
}

export async function createTask(title: string): Promise<Task> {
  const trimmed = title.trim();
  if (!trimmed) throw new Error("Title is required");

  const { data, error } = await db()
    .from("tasks")
    .insert({
      title: trimmed,
      is_done: false,
      completed_at: null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Task;
}

export async function toggleTask(
  id: string,
  isDone: boolean
): Promise<Task> {
  const { data, error } = await db()
    .from("tasks")
    .update({
      is_done: isDone,
      completed_at: isDone ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Task;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await db().from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export type DayStat = {
  date: string; // yyyy-MM-dd
  label: string;
  completed: number;
};

export type ConsistencyStats = {
  days: DayStat[];
  completedToday: number;
  completedThisWeek: number;
  streak: number;
  totalOpen: number;
  totalDone: number;
};

export function computeConsistency(
  tasks: Task[],
  daysBack = 30
): ConsistencyStats {
  const now = new Date();
  const start = startOfDay(subDays(now, daysBack - 1));
  const end = endOfDay(now);

  const range = eachDayOfInterval({ start, end });
  const completedTasks = tasks.filter((t) => t.completed_at);

  const days: DayStat[] = range.map((day) => {
    const count = completedTasks.filter((t) =>
      isSameDay(parseISO(t.completed_at!), day)
    ).length;
    return {
      date: format(day, "yyyy-MM-dd"),
      label: format(day, "d MMM"),
      completed: count,
    };
  });

  const completedToday =
    days.find((d) => d.date === format(now, "yyyy-MM-dd"))?.completed ?? 0;

  const weekStart = startOfDay(subDays(now, 6));
  const completedThisWeek = completedTasks.filter((t) => {
    const d = parseISO(t.completed_at!);
    return d >= weekStart && d <= end;
  }).length;

  // Streak: consecutive days with ≥1 completion, ending today (or yesterday if today is empty)
  let streak = 0;
  let i = days.length - 1;
  if (days[i]?.completed === 0) i -= 1;
  for (; i >= 0; i--) {
    if (days[i].completed > 0) streak++;
    else break;
  }

  return {
    days,
    completedToday,
    completedThisWeek,
    streak,
    totalOpen: tasks.filter((t) => !t.is_done).length,
    totalDone: tasks.filter((t) => t.is_done).length,
  };
}
