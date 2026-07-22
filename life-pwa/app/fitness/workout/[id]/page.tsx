"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatDurationClock,
  isCardioExercise,
  type GhostSet,
  type SessionSet,
  type WorkoutSession,
} from "@/lib/schema";
import {
  addSessionSet,
  deleteSessionSet,
  discardSession,
  finishSession,
  formatDuration,
  getGhostsForExercises,
  getSession,
  listSessionSets,
  updateSessionSet,
} from "@/modules/fitness/lib/sessions";
import {
  RestTimerBar,
  RestTimerSettingsButton,
  useRestTimer,
} from "@/modules/fitness/components/rest-timer";

type ExerciseBlock = {
  exerciseId: string;
  name: string;
  isCardio: boolean;
  sets: SessionSet[];
  ghosts: GhostSet[];
};

export default function LiveWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sets, setSets] = useState<SessionSet[]>([]);
  const [ghosts, setGhosts] = useState<Record<string, GhostSet[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);
  /** Exercise IDs whose set lists are collapsed */
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const restTimer = useRestTimer();

  // live duration clock
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const refresh = useCallback(async () => {
    const [s, ss] = await Promise.all([getSession(id), listSessionSets(id)]);
    setSession(s);
    setSets(ss);
    // Collapse exercises that already have every set complete (resume)
    const byEx = new Map<string, SessionSet[]>();
    for (const set of ss) {
      const list = byEx.get(set.exercise_id) ?? [];
      list.push(set);
      byEx.set(set.exercise_id, list);
    }
    const doneIds = new Set<string>();
    for (const [exId, list] of byEx) {
      if (list.length > 0 && list.every((x) => x.completed)) {
        doneIds.add(exId);
      }
    }
    setCollapsed(doneIds);
    const exIds = [...new Set(ss.map((x) => x.exercise_id))];
    if (exIds.length) {
      setGhosts(await getGhostsForExercises(exIds, id));
    }
  }, [id]);

  useEffect(() => {
    void refresh()
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [refresh]);

  const blocks = useMemo((): ExerciseBlock[] => {
    const order: string[] = [];
    const byEx = new Map<string, SessionSet[]>();
    for (const s of sets) {
      if (!byEx.has(s.exercise_id)) {
        order.push(s.exercise_id);
        byEx.set(s.exercise_id, []);
      }
      byEx.get(s.exercise_id)!.push(s);
    }
    const list = order.map((exerciseId) => {
      const group = byEx.get(exerciseId)!;
      return {
        exerciseId,
        name: group[0]?.exercise?.name ?? "Exercise",
        isCardio: isCardioExercise(group[0]?.exercise),
        sets: group,
        ghosts: ghosts[exerciseId] ?? [],
      };
    });
    // Fully completed exercises pin to the top (stable among ties)
    return list.sort((a, b) => {
      const aDone =
        a.sets.length > 0 && a.sets.every((s) => s.completed);
      const bDone =
        b.sets.length > 0 && b.sets.every((s) => s.completed);
      if (aDone === bDone) return 0;
      return aDone ? -1 : 1;
    });
  }, [sets, ghosts]);

  function toggleCollapsed(exerciseId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  }

  function applyExerciseCollapse(
    exerciseId: string,
    exerciseSets: SessionSet[]
  ) {
    const allDone =
      exerciseSets.length > 0 && exerciseSets.every((s) => s.completed);
    setCollapsed((c) => {
      const nextCollapsed = new Set(c);
      if (allDone) nextCollapsed.add(exerciseId);
      else nextCollapsed.delete(exerciseId);
      return nextCollapsed;
    });
  }

  async function onToggleComplete(set: SessionSet) {
    // Use latest local row (weight/reps typed in UI, not yet on server)
    const latest = sets.find((s) => s.id === set.id) ?? set;
    const next = !latest.completed;
    const previous = { ...latest };

    // Optimistic UI — update before network round-trip
    setSets((prev) =>
      prev.map((s) => (s.id === latest.id ? { ...s, completed: next } : s))
    );
    const exerciseSetsOptimistic = sets
      .filter((s) => s.exercise_id === latest.exercise_id)
      .map((s) =>
        s.id === latest.id ? { ...s, completed: next } : s
      );
    applyExerciseCollapse(latest.exercise_id, exerciseSetsOptimistic);

    // Rest between sets: start only when marking complete
    if (next) restTimer.start();

    try {
      // Persist field values only when completing (not on input blur)
      const updated = await updateSessionSet(
        latest.id,
        next
          ? {
              completed: true,
              weight_kg: latest.weight_kg,
              reps: latest.reps,
              duration_seconds: latest.duration_seconds,
              distance_km: latest.distance_km,
            }
          : { completed: false }
      );
      setSets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (e) {
      // Roll back on failure
      setSets((prev) =>
        prev.map((s) => (s.id === previous.id ? previous : s))
      );
      const exerciseSetsRollback = sets
        .filter((s) => s.exercise_id === previous.exercise_id)
        .map((s) => (s.id === previous.id ? previous : s));
      applyExerciseCollapse(previous.exercise_id, exerciseSetsRollback);
      setError(e instanceof Error ? e.message : "Could not update set");
    }
  }

  async function onAddSet(block: ExerciseBlock) {
    const nextIndex =
      Math.max(0, ...block.sets.map((s) => s.set_index)) + 1 || 1;
    const last = block.sets[block.sets.length - 1];
    const ghost = block.ghosts.find((g) => g.set_index === nextIndex);
    const created = await addSessionSet({
      session_id: id,
      exercise_id: block.exerciseId,
      set_index: nextIndex,
      weight_kg: block.isCardio
        ? null
        : last?.weight_kg ?? ghost?.weight_kg ?? null,
      reps: block.isCardio ? null : last?.reps ?? ghost?.reps ?? null,
      duration_seconds: block.isCardio
        ? last?.duration_seconds ?? ghost?.duration_seconds ?? null
        : null,
      distance_km: block.isCardio
        ? last?.distance_km ?? ghost?.distance_km ?? null
        : null,
    });
    setSets((prev) => [...prev, created]);
  }

  async function onRemoveSet(setId: string) {
    await deleteSessionSet(setId);
    setSets((prev) => prev.filter((s) => s.id !== setId));
  }

  async function onFinish() {
    if (!confirm("Finish this workout?")) return;
    setBusy(true);
    restTimer.skip();
    try {
      await finishSession(id);
      router.push(`/fitness/history/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not finish");
      setBusy(false);
    }
  }

  async function onDiscard() {
    if (!confirm("Discard this workout? Sets will be deleted.")) return;
    setBusy(true);
    restTimer.skip();
    try {
      await discardSession(id);
      router.push("/fitness");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not discard");
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Workout">
        <p className="text-muted-foreground">
          <Loader2 className="inline size-4 animate-spin" /> Loading…
        </p>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell title="Workout">
        <p className="text-destructive">Session not found.</p>
        <Link href="/fitness" className={buttonVariants()}>
          Back
        </Link>
      </AppShell>
    );
  }

  if (session.finished_at) {
    return (
      <AppShell title="Workout">
        <p className="text-muted-foreground">This session is already finished.</p>
        <Link
          href={`/fitness/history/${id}`}
          className={cn(buttonVariants(), "mt-3 rounded-full")}
        >
          View history
        </Link>
      </AppShell>
    );
  }

  const completedCount = sets.filter((s) => s.completed).length;

  return (
    <AppShell
      title={session.name || "Live workout"}
      subtitle={`${formatDuration(session.started_at)} · ${completedCount}/${sets.length} sets`}
      actions={
        <div className="flex items-center gap-2">
          <RestTimerSettingsButton
            secondsPref={restTimer.secondsPref}
            setSecondsPref={restTimer.setSecondsPref}
          />
          <Button
            size="sm"
            className="rounded-full"
            disabled={busy}
            onClick={() => void onFinish()}
          >
            Finish
          </Button>
        </div>
      }
    >
      {error && (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <RestTimerBar timer={restTimer} />

      {blocks.length === 0 ? (
        <p className="text-muted-foreground">
          No sets yet. Start from a program so exercises are pre-filled.
        </p>
      ) : (
        <div
          className={cn(
            "flex flex-col gap-6",
            (restTimer.isRunning || restTimer.justDone) && "pb-28"
          )}
        >
          {blocks.map((block) => {
            const doneCount = block.sets.filter((s) => s.completed).length;
            const allDone =
              block.sets.length > 0 && doneCount === block.sets.length;
            const isCollapsed = collapsed.has(block.exerciseId);

            return (
              <section
                key={block.exerciseId}
                className="rounded-2xl border border-border/80 bg-card p-4"
              >
                <button
                  type="button"
                  className="flex w-full items-start gap-2 text-left"
                  onClick={() => toggleCollapsed(block.exerciseId)}
                  aria-expanded={!isCollapsed}
                >
                  <ChevronDown
                    className={cn(
                      "mt-1 size-5 shrink-0 text-muted-foreground transition-transform",
                      isCollapsed && "-rotate-90"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold leading-tight">
                      {block.name}
                      {block.isCardio && (
                        <span className="ml-2 text-xs font-semibold text-primary">
                          Cardio
                        </span>
                      )}
                      {allDone && (
                        <Check
                          className="ml-2 inline size-4 text-primary"
                          aria-label="All sets complete"
                        />
                      )}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {doneCount}/{block.sets.length} sets
                      {isCollapsed && allDone && " · done"}
                    </p>
                  </div>
                </button>

                {!isCollapsed &&
                  (block.isCardio ? (
                    <div className="mt-3">
                      <div className="mb-2 grid grid-cols-[1fr_1fr_2.5rem] gap-2 text-xs font-semibold text-muted-foreground">
                        <span>Time (min)</span>
                        <span>Distance (km)</span>
                        <span />
                      </div>
                      <ul className="flex flex-col gap-2">
                        {block.sets.map((set) => {
                          const ghost = block.ghosts.find(
                            (g) => g.set_index === set.set_index
                          );
                          const timeMin =
                            set.duration_seconds != null
                              ? (set.duration_seconds / 60).toFixed(
                                  set.duration_seconds % 60 === 0 ? 0 : 1
                                )
                              : "";
                          return (
                            <li key={set.id} className="flex flex-col gap-1">
                              {ghost && (
                                <p className="text-xs text-muted-foreground">
                                  Prev:{" "}
                                  {formatDurationClock(ghost.duration_seconds)}{" "}
                                  ·{" "}
                                  {ghost.distance_km != null
                                    ? `${ghost.distance_km} km`
                                    : "—"}
                                </p>
                              )}
                              <div className="grid grid-cols-[1fr_1fr_2.5rem] items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  className="h-10"
                                  value={timeMin}
                                  placeholder={
                                    ghost?.duration_seconds != null
                                      ? String(
                                          Math.round(
                                            (ghost.duration_seconds / 60) * 10
                                          ) / 10
                                        )
                                      : "min"
                                  }
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setSets((prev) =>
                                      prev.map((s) =>
                                        s.id === set.id
                                          ? {
                                              ...s,
                                              duration_seconds:
                                                v === ""
                                                  ? null
                                                  : Math.round(Number(v) * 60),
                                            }
                                          : s
                                      )
                                    );
                                  }}
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="h-10"
                                  value={set.distance_km ?? ""}
                                  placeholder={
                                    ghost?.distance_km != null
                                      ? String(ghost.distance_km)
                                      : "km"
                                  }
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setSets((prev) =>
                                      prev.map((s) =>
                                        s.id === set.id
                                          ? {
                                              ...s,
                                              distance_km:
                                                v === "" ? null : Number(v),
                                            }
                                          : s
                                      )
                                    );
                                  }}
                                />
                                <Button
                                  type="button"
                                  size="icon"
                                  variant={
                                    set.completed ? "default" : "outline"
                                  }
                                  className={cn(
                                    "size-10 rounded-full",
                                    set.completed && "bg-primary"
                                  )}
                                  onClick={() => void onToggleComplete(set)}
                                >
                                  <Check className="size-4" />
                                </Button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="mb-2 grid grid-cols-[2rem_1fr_1fr_2.5rem] gap-2 text-xs font-semibold text-muted-foreground">
                        <span>#</span>
                        <span>kg</span>
                        <span>Reps</span>
                        <span />
                      </div>
                      <ul className="flex flex-col gap-2">
                        {block.sets.map((set) => {
                          const ghost = block.ghosts.find(
                            (g) => g.set_index === set.set_index
                          );
                          return (
                            <li key={set.id} className="flex flex-col gap-1">
                              {ghost && (
                                <p className="pl-8 text-xs text-muted-foreground">
                                  Prev:{" "}
                                  {ghost.weight_kg != null
                                    ? `${ghost.weight_kg} kg`
                                    : "—"}{" "}
                                  × {ghost.reps ?? "—"}
                                </p>
                              )}
                              <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem] items-center gap-2">
                                <span className="text-center text-sm font-semibold text-muted-foreground">
                                  {set.set_index}
                                </span>
                                <Input
                                  type="number"
                                  step="0.5"
                                  className="h-10"
                                  value={set.weight_kg ?? ""}
                                  placeholder={
                                    ghost?.weight_kg != null
                                      ? String(ghost.weight_kg)
                                      : "kg"
                                  }
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setSets((prev) =>
                                      prev.map((s) =>
                                        s.id === set.id
                                          ? {
                                              ...s,
                                              weight_kg:
                                                v === "" ? null : Number(v),
                                            }
                                          : s
                                      )
                                    );
                                  }}
                                />
                                <Input
                                  type="number"
                                  step="1"
                                  className="h-10"
                                  value={set.reps ?? ""}
                                  placeholder={
                                    ghost?.reps != null
                                      ? String(ghost.reps)
                                      : "reps"
                                  }
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setSets((prev) =>
                                      prev.map((s) =>
                                        s.id === set.id
                                          ? {
                                              ...s,
                                              reps:
                                                v === "" ? null : Number(v),
                                            }
                                          : s
                                      )
                                    );
                                  }}
                                />
                                <Button
                                  type="button"
                                  size="icon"
                                  variant={
                                    set.completed ? "default" : "outline"
                                  }
                                  className={cn(
                                    "size-10 rounded-full",
                                    set.completed && "bg-primary"
                                  )}
                                  onClick={() => void onToggleComplete(set)}
                                >
                                  <Check className="size-4" />
                                </Button>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  className="text-xs text-muted-foreground hover:text-destructive"
                                  onClick={() => void onRemoveSet(set.id)}
                                >
                                  <Trash2 className="mr-1 inline size-3" />
                                  Remove set
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-3 rounded-full"
                        onClick={() => void onAddSet(block)}
                      >
                        <Plus className="size-4" /> Add set
                      </Button>
                    </div>
                  ))}
              </section>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-2">
        <Button
          size="lg"
          className="h-12 rounded-full"
          disabled={busy}
          onClick={() => void onFinish()}
        >
          Finish workout
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="rounded-full text-destructive"
          disabled={busy}
          onClick={() => void onDiscard()}
        >
          Discard workout
        </Button>
      </div>
    </AppShell>
  );
}
