import { db } from "@/lib/supabase/client";
import type {
  BodyWeight,
  Exercise,
  Program,
  ProgramExercise,
  WeeklyPlanDay,
} from "@/lib/schema";

function mapExercise(row: Record<string, unknown>): Exercise {
  return {
    id: row.id as string,
    name: row.name as string,
    muscle_group: (row.muscle_group as string) ?? null,
    is_custom: Boolean(row.is_custom),
    exercise_kind:
      row.exercise_kind === "cardio" ? "cardio" : "strength",
    created_at: row.created_at as string,
  };
}

export async function listExercises(): Promise<Exercise[]> {
  const { data, error } = await db()
    .from("exercises")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((r) => mapExercise(r as Record<string, unknown>));
}

export async function createExercise(
  name: string,
  muscle_group: string,
  exercise_kind: "strength" | "cardio" = "strength"
): Promise<Exercise> {
  const { data, error } = await db()
    .from("exercises")
    .insert({
      name: name.trim(),
      muscle_group: muscle_group || null,
      is_custom: true,
      exercise_kind,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapExercise(data as Record<string, unknown>);
}

export async function listPrograms(): Promise<Program[]> {
  const { data, error } = await db()
    .from("programs")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Program[];
}

export async function getProgram(id: string): Promise<Program | null> {
  const { data, error } = await db()
    .from("programs")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Program | null;
}

export async function createProgram(
  name: string,
  notes?: string
): Promise<Program> {
  const { data, error } = await db()
    .from("programs")
    .insert({ name: name.trim(), notes: notes?.trim() || null })
    .select("*")
    .single();
  if (error) throw error;
  return data as Program;
}

export async function updateProgram(
  id: string,
  patch: { name?: string; notes?: string | null }
): Promise<Program> {
  const { data, error } = await db()
    .from("programs")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Program;
}

export async function deleteProgram(id: string): Promise<void> {
  const { error } = await db().from("programs").delete().eq("id", id);
  if (error) throw error;
}

export async function listProgramExercises(
  programId: string
): Promise<ProgramExercise[]> {
  const { data, error } = await db()
    .from("program_exercises")
    .select("*, exercise:exercises(*)")
    .eq("program_id", programId)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as ProgramExercise & {
      exercise: Exercise | Exercise[] | Record<string, unknown>;
      target_duration_min?: number | null;
      target_distance_km?: number | null;
    };
    const exRaw = Array.isArray(r.exercise) ? r.exercise[0] : r.exercise;
    const exercise = exRaw
      ? mapExercise(exRaw as Record<string, unknown>)
      : undefined;
    return {
      ...r,
      target_duration_min:
        r.target_duration_min != null ? Number(r.target_duration_min) : null,
      target_distance_km:
        r.target_distance_km != null ? Number(r.target_distance_km) : null,
      exercise,
    };
  });
}

export async function addProgramExercise(input: {
  program_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: number;
  target_reps: string;
  target_weight_kg: number | null;
  target_duration_min?: number | null;
  target_distance_km?: number | null;
}): Promise<ProgramExercise> {
  const { data, error } = await db()
    .from("program_exercises")
    .insert({
      program_id: input.program_id,
      exercise_id: input.exercise_id,
      sort_order: input.sort_order,
      target_sets: input.target_sets,
      target_reps: input.target_reps,
      target_weight_kg: input.target_weight_kg,
      target_duration_min: input.target_duration_min ?? null,
      target_distance_km: input.target_distance_km ?? null,
    })
    .select("*, exercise:exercises(*)")
    .single();
  if (error) throw error;
  const r = data as ProgramExercise & { exercise: Exercise | Exercise[] };
  return {
    ...r,
    exercise: Array.isArray(r.exercise) ? r.exercise[0] : r.exercise,
  };
}

export async function updateProgramExercise(
  id: string,
  patch: Partial<{
    sort_order: number;
    target_sets: number;
    target_reps: string;
    target_weight_kg: number | null;
  }>
): Promise<void> {
  const { error } = await db()
    .from("program_exercises")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function removeProgramExercise(id: string): Promise<void> {
  const { error } = await db().from("program_exercises").delete().eq("id", id);
  if (error) throw error;
}

export async function getWeeklyPlan(): Promise<WeeklyPlanDay[]> {
  const { data, error } = await db()
    .from("weekly_plan")
    .select("*, program:programs(*)")
    .order("weekday");
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as WeeklyPlanDay & { program: Program | Program[] | null };
    return {
      weekday: r.weekday,
      program_id: r.program_id,
      is_rest: r.is_rest,
      program: Array.isArray(r.program) ? r.program[0] : r.program,
    };
  });
}

export async function setWeeklyPlanDay(
  weekday: number,
  value: { is_rest: boolean; program_id: string | null }
): Promise<void> {
  const { error } = await db()
    .from("weekly_plan")
    .upsert({
      weekday,
      is_rest: value.is_rest,
      program_id: value.is_rest ? null : value.program_id,
    });
  if (error) throw error;
}

/** Monday = 0 … Sunday = 6 (matches DB convention) */
export function todayWeekday(date = new Date()): number {
  const js = date.getDay(); // 0=Sun
  return js === 0 ? 6 : js - 1;
}

export async function listBodyWeights(): Promise<BodyWeight[]> {
  const { data, error } = await db()
    .from("body_weights")
    .select("*")
    .order("weighed_on", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BodyWeight[];
}

export async function upsertBodyWeight(
  weighed_on: string,
  weight_kg: number,
  notes?: string
): Promise<BodyWeight> {
  const { data, error } = await db()
    .from("body_weights")
    .upsert(
      {
        weighed_on,
        weight_kg,
        notes: notes?.trim() || null,
      },
      { onConflict: "weighed_on" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as BodyWeight;
}

export async function deleteBodyWeight(id: string): Promise<void> {
  const { error } = await db().from("body_weights").delete().eq("id", id);
  if (error) throw error;
}
