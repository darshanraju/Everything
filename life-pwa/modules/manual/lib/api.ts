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
  /** Historical incomplete left on an old day after rollover (SLA only). */
  is_carry_stub: boolean;
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
    is_carry_stub: Boolean(row.is_carry_stub),
  };
}

export function dateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/**
 * Incomplete active tasks from past days move to `today`.
 * A carry stub stays on the old due_on (is_done=false) so SLA still
 * counts that day as incomplete for that task.
 */
export async function rolloverIncompleteTasks(
  today: Date = new Date()
): Promise<number> {
  const todayKey = dateKey(today);
  const { data: past, error } = await db()
    .from("today_tasks")
    .select("*")
    .lt("due_on", todayKey)
    .eq("is_done", false)
    .eq("is_carry_stub", false);
  if (error) throw error;
  if (!past?.length) return 0;

  let moved = 0;
  for (const row of past) {
    const task = mapTask(row as Record<string, unknown>);

    // SLA footprint for the day we left it open
    const { error: stubErr } = await db().from("today_tasks").insert({
      title: task.title,
      notes: task.notes,
      due_on: task.due_on,
      is_done: false,
      is_carry_stub: true,
    });
    if (stubErr) throw stubErr;

    const { error: moveErr } = await db()
      .from("today_tasks")
      .update({
        due_on: todayKey,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id)
      .eq("is_carry_stub", false);
    if (moveErr) throw moveErr;
    moved += 1;
  }
  return moved;
}

export async function listTasksForDate(date: Date): Promise<ManualTodayTask[]> {
  const due = dateKey(date);
  // Rollover only when loading "today" so past-day views stay frozen
  if (due === dateKey(new Date())) {
    try {
      await rolloverIncompleteTasks(date);
    } catch (e) {
      // Older DBs without is_carry_stub: still try to list
      console.error("rolloverIncompleteTasks failed", e);
    }
  }

  const { data, error } = await db()
    .from("today_tasks")
    .select("*")
    .eq("due_on", due)
    .eq("is_carry_stub", false)
    .order("is_done", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapTask(r as Record<string, unknown>));
}

export async function createTodayTask(
  titleOrOpts:
    | string
    | {
        title: string;
        dueOn?: Date;
        notes?: string | null;
      },
  dueOn?: Date
): Promise<ManualTodayTask> {
  const title =
    typeof titleOrOpts === "string" ? titleOrOpts : titleOrOpts.title;
  const due =
    typeof titleOrOpts === "string" ? dueOn : titleOrOpts.dueOn;
  const notes =
    typeof titleOrOpts === "string" ? null : (titleOrOpts.notes ?? null);

  const { data, error } = await db()
    .from("today_tasks")
    .insert({
      title: title.trim(),
      notes: notes?.trim() || null,
      due_on: dateKey(due ?? new Date()),
      is_done: false,
      is_carry_stub: false,
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
