import { db } from "@/lib/supabase/client";
import { format } from "date-fns";

export type ManualTodayTask = {
  id: string;
  title: string;
  notes: string | null;
  due_on: string;
  is_done: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapTask(row: Record<string, unknown>): ManualTodayTask {
  return {
    id: row.id as string,
    title: row.title as string,
    notes: (row.notes as string) ?? null,
    due_on: row.due_on as string,
    is_done: Boolean(row.is_done),
    completed_at: (row.completed_at as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function dateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export async function listTasksForDate(date: Date): Promise<ManualTodayTask[]> {
  const due = dateKey(date);
  const { data, error } = await db()
    .from("today_tasks")
    .select("*")
    .eq("due_on", due)
    .order("is_done", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapTask(r as Record<string, unknown>));
}

export async function createTodayTask(
  title: string,
  dueOn?: Date
): Promise<ManualTodayTask> {
  const { data, error } = await db()
    .from("today_tasks")
    .insert({
      title: title.trim(),
      due_on: dateKey(dueOn ?? new Date()),
      is_done: false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapTask(data as Record<string, unknown>);
}

export async function toggleTodayTask(
  id: string,
  isDone: boolean
): Promise<ManualTodayTask> {
  const { data, error } = await db()
    .from("today_tasks")
    .update({
      is_done: isDone,
      completed_at: isDone ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapTask(data as Record<string, unknown>);
}

export async function deleteTodayTask(id: string): Promise<void> {
  const { error } = await db().from("today_tasks").delete().eq("id", id);
  if (error) throw error;
}
