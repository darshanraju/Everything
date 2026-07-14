import { db } from "@/lib/supabase/client";
import type {
  Exercise,
  GhostSet,
  Program,
  ProgramExercise,
  SessionSet,
  WorkoutSession,
} from "@/lib/schema";

function mapSession(row: Record<string, unknown>): WorkoutSession {
  const program = row.program as Program | Program[] | null | undefined;
  return {
    id: row.id as string,
    program_id: (row.program_id as string) ?? null,
    name: (row.name as string) ?? null,
    started_at: row.started_at as string,
    finished_at: (row.finished_at as string) ?? null,
    notes: (row.notes as string) ?? null,
    created_at: row.created_at as string,
    program: Array.isArray(program) ? program[0] : program ?? null,
  };
}

function mapSet(row: Record<string, unknown>): SessionSet {
  const exercise = row.exercise as Exercise | Exercise[] | undefined;
  const ex = Array.isArray(exercise) ? exercise[0] : exercise;
  return {
    id: row.id as string,
    session_id: row.session_id as string,
    exercise_id: row.exercise_id as string,
    set_index: row.set_index as number,
    weight_kg: row.weight_kg != null ? Number(row.weight_kg) : null,
    reps: row.reps != null ? Number(row.reps) : null,
    rpe: row.rpe != null ? Number(row.rpe) : null,
    duration_seconds:
      row.duration_seconds != null ? Number(row.duration_seconds) : null,
    distance_km: row.distance_km != null ? Number(row.distance_km) : null,
    completed: Boolean(row.completed),
    created_at: row.created_at as string,
    exercise: ex
      ? {
          ...ex,
          exercise_kind:
            (ex as Exercise).exercise_kind === "cardio" ? "cardio" : "strength",
        }
      : undefined,
  };
}

/** Active (unfinished) session if any */
export async function getActiveSession(): Promise<WorkoutSession | null> {
  const { data, error } = await db()
    .from("workout_sessions")
    .select("*, program:programs(*)")
    .is("finished_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSession(data as Record<string, unknown>) : null;
}

export async function startSession(input: {
  program_id?: string | null;
  name?: string | null;
  programExercises?: ProgramExercise[];
}): Promise<WorkoutSession> {
  const { data, error } = await db()
    .from("workout_sessions")
    .insert({
      program_id: input.program_id ?? null,
      name: input.name?.trim() || "Workout",
      started_at: new Date().toISOString(),
    })
    .select("*, program:programs(*)")
    .single();
  if (error) throw error;
  const session = mapSession(data as Record<string, unknown>);

  // Pre-create empty working sets from program prescription
  const pe = input.programExercises ?? [];
  if (pe.length > 0) {
    const rows: {
      session_id: string;
      exercise_id: string;
      set_index: number;
      weight_kg: number | null;
      reps: number | null;
      duration_seconds: number | null;
      distance_km: number | null;
      completed: boolean;
    }[] = [];
    for (const item of pe) {
      const isCardio = item.exercise?.exercise_kind === "cardio";
      if (isCardio) {
        // One log entry per cardio block (time + distance)
        const durMin = item.target_duration_min;
        rows.push({
          session_id: session.id,
          exercise_id: item.exercise_id,
          set_index: 1,
          weight_kg: null,
          reps: null,
          duration_seconds:
            durMin != null ? Math.round(Number(durMin) * 60) : null,
          distance_km:
            item.target_distance_km != null
              ? Number(item.target_distance_km)
              : null,
          completed: false,
        });
      } else {
        const n = Math.max(1, item.target_sets || 3);
        for (let i = 1; i <= n; i++) {
          rows.push({
            session_id: session.id,
            exercise_id: item.exercise_id,
            set_index: i,
            weight_kg: item.target_weight_kg,
            reps: parseRepsTarget(item.target_reps),
            duration_seconds: null,
            distance_km: null,
            completed: false,
          });
        }
      }
    }
    const { error: setErr } = await db().from("session_sets").insert(rows);
    if (setErr) throw setErr;
  }

  return session;
}

function parseRepsTarget(target: string): number | null {
  const m = target.trim().match(/^(\d+)/);
  return m ? Number(m[1]) : null;
}

export async function finishSession(id: string): Promise<WorkoutSession> {
  const { data, error } = await db()
    .from("workout_sessions")
    .update({ finished_at: new Date().toISOString() })
    .eq("id", id)
    .select("*, program:programs(*)")
    .single();
  if (error) throw error;
  return mapSession(data as Record<string, unknown>);
}

export async function discardSession(id: string): Promise<void> {
  const { error } = await db().from("workout_sessions").delete().eq("id", id);
  if (error) throw error;
}

export async function listSessions(limit = 40): Promise<WorkoutSession[]> {
  const { data, error } = await db()
    .from("workout_sessions")
    .select("*, program:programs(*)")
    .not("finished_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => mapSession(r as Record<string, unknown>));
}

export async function getSession(id: string): Promise<WorkoutSession | null> {
  const { data, error } = await db()
    .from("workout_sessions")
    .select("*, program:programs(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSession(data as Record<string, unknown>) : null;
}

export async function listSessionSets(sessionId: string): Promise<SessionSet[]> {
  const { data, error } = await db()
    .from("session_sets")
    .select("*, exercise:exercises(*)")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  // stable order: group by exercise order of first appearance, then set_index
  const sets = (data ?? []).map((r) => mapSet(r as Record<string, unknown>));
  const exerciseOrder: string[] = [];
  for (const s of sets) {
    if (!exerciseOrder.includes(s.exercise_id)) {
      exerciseOrder.push(s.exercise_id);
    }
  }
  return sets.sort((a, b) => {
    const oi = exerciseOrder.indexOf(a.exercise_id);
    const oj = exerciseOrder.indexOf(b.exercise_id);
    if (oi !== oj) return oi - oj;
    return a.set_index - b.set_index;
  });
}

export async function updateSessionSet(
  id: string,
  patch: Partial<{
    weight_kg: number | null;
    reps: number | null;
    rpe: number | null;
    duration_seconds: number | null;
    distance_km: number | null;
    completed: boolean;
    set_index: number;
  }>
): Promise<SessionSet> {
  const { data, error } = await db()
    .from("session_sets")
    .update(patch)
    .eq("id", id)
    .select("*, exercise:exercises(*)")
    .single();
  if (error) throw error;
  return mapSet(data as Record<string, unknown>);
}

export async function addSessionSet(input: {
  session_id: string;
  exercise_id: string;
  set_index: number;
  weight_kg?: number | null;
  reps?: number | null;
  duration_seconds?: number | null;
  distance_km?: number | null;
}): Promise<SessionSet> {
  const { data, error } = await db()
    .from("session_sets")
    .insert({
      session_id: input.session_id,
      exercise_id: input.exercise_id,
      set_index: input.set_index,
      weight_kg: input.weight_kg ?? null,
      reps: input.reps ?? null,
      duration_seconds: input.duration_seconds ?? null,
      distance_km: input.distance_km ?? null,
      completed: false,
    })
    .select("*, exercise:exercises(*)")
    .single();
  if (error) throw error;
  return mapSet(data as Record<string, unknown>);
}

export async function deleteSessionSet(id: string): Promise<void> {
  const { error } = await db().from("session_sets").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Ghost sets = completed sets from the most recent finished session
 * that included this exercise (excluding current session).
 */
export async function getGhostSetsForExercise(
  exerciseId: string,
  excludeSessionId?: string
): Promise<GhostSet[]> {
  const { data: sessions, error: sErr } = await db()
    .from("workout_sessions")
    .select("id, finished_at")
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false })
    .limit(40);
  if (sErr) throw sErr;

  const sessionIds = (sessions ?? [])
    .map((s) => s.id as string)
    .filter((id) => id !== excludeSessionId);
  if (!sessionIds.length) return [];

  const { data: sets, error } = await db()
    .from("session_sets")
    .select("session_id, set_index, weight_kg, reps, duration_seconds, distance_km")
    .eq("exercise_id", exerciseId)
    .eq("completed", true)
    .in("session_id", sessionIds);
  if (error) throw error;

  for (const sid of sessionIds) {
    const ghost = (sets ?? [])
      .filter((s) => s.session_id === sid)
      .sort((a, b) => Number(a.set_index) - Number(b.set_index))
      .map((s) => ({
        set_index: Number(s.set_index),
        weight_kg: s.weight_kg != null ? Number(s.weight_kg) : null,
        reps: s.reps != null ? Number(s.reps) : null,
        duration_seconds:
          s.duration_seconds != null ? Number(s.duration_seconds) : null,
        distance_km: s.distance_km != null ? Number(s.distance_km) : null,
      }));
    if (ghost.length > 0) return ghost;
  }
  return [];
}

export async function getGhostsForExercises(
  exerciseIds: string[],
  excludeSessionId?: string
): Promise<Record<string, GhostSet[]>> {
  const unique = [...new Set(exerciseIds)];
  const entries = await Promise.all(
    unique.map(async (id) => {
      const ghosts = await getGhostSetsForExercise(id, excludeSessionId);
      return [id, ghosts] as const;
    })
  );
  return Object.fromEntries(entries);
}

export function formatDuration(startIso: string, endIso?: string | null): string {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const mins = Math.max(0, Math.round((end - start) / 60000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export function sessionVolume(sets: SessionSet[]): number {
  return sets
    .filter((s) => s.completed && s.weight_kg != null && s.reps != null)
    .reduce((sum, s) => sum + Number(s.weight_kg) * Number(s.reps), 0);
}
