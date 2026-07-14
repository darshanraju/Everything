"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { SubNav } from "@/components/shell/sub-nav";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Exercise, Program, ProgramExercise } from "@/lib/schema";
import { FITNESS_SUBNAV } from "@/modules/fitness/nav";
import {
  addProgramExercise,
  getProgram,
  listExercises,
  listProgramExercises,
  removeProgramExercise,
  updateProgram,
  updateProgramExercise,
} from "@/modules/fitness/lib/api";

export default function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [program, setProgram] = useState<Program | null>(null);
  const [rows, setRows] = useState<ProgramExercise[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [exerciseId, setExerciseId] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("8-10");
  const [weight, setWeight] = useState("");
  const [durationMin, setDurationMin] = useState("30");
  const [distanceKm, setDistanceKm] = useState("5");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selected = library.find((e) => e.id === exerciseId);
  const selectedIsCardio = selected?.exercise_kind === "cardio";

  async function refresh() {
    const [p, pe, ex] = await Promise.all([
      getProgram(id),
      listProgramExercises(id),
      listExercises(),
    ]);
    setProgram(p);
    setRows(pe);
    setLibrary(ex);
    if (!exerciseId && ex[0]) setExerciseId(ex[0].id);
  }

  useEffect(() => {
    void refresh()
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onRename(name: string) {
    if (!program || !name.trim()) return;
    const p = await updateProgram(program.id, { name: name.trim() });
    setProgram(p);
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!exerciseId) return;
    setError(null);
    try {
      if (selectedIsCardio) {
        await addProgramExercise({
          program_id: id,
          exercise_id: exerciseId,
          sort_order: rows.length,
          target_sets: 1,
          target_reps: "—",
          target_weight_kg: null,
          target_duration_min: durationMin ? Number(durationMin) : null,
          target_distance_km: distanceKm ? Number(distanceKm) : null,
        });
      } else {
        await addProgramExercise({
          program_id: id,
          exercise_id: exerciseId,
          sort_order: rows.length,
          target_sets: Number(sets) || 3,
          target_reps: reps.trim() || "8-10",
          target_weight_kg: weight ? Number(weight) : null,
        });
        setWeight("");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add exercise");
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= rows.length) return;
    const a = rows[index];
    const b = rows[j];
    await Promise.all([
      updateProgramExercise(a.id, { sort_order: j }),
      updateProgramExercise(b.id, { sort_order: index }),
    ]);
    await refresh();
  }

  if (loading) {
    return (
      <AppShell title="Program">
        <p className="text-muted-foreground">
          <Loader2 className="inline size-4 animate-spin" /> Loading…
        </p>
      </AppShell>
    );
  }

  if (!program) {
    return (
      <AppShell title="Program">
        <p className="text-destructive">Program not found.</p>
        <Link href="/fitness/programs" className={buttonVariants()}>
          Back
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell title={program.name} subtitle="Sets · reps · optional weight (kg)">
      <SubNav items={FITNESS_SUBNAV} />

      <div className="mb-4 grid gap-2">
        <Label>Program name</Label>
        <Input
          defaultValue={program.name}
          className="h-11"
          onBlur={(e) => void onRename(e.target.value)}
        />
      </div>

      <form
        onSubmit={onAdd}
        className="mb-5 flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4"
      >
        <p className="text-sm font-semibold">Add exercise</p>
        <select
          value={exerciseId}
          onChange={(e) => setExerciseId(e.target.value)}
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
        >
          {library.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
              {ex.exercise_kind === "cardio" ? " (cardio)" : ""}
            </option>
          ))}
        </select>
        {selectedIsCardio ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Time (min)</Label>
              <Input
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                type="number"
                step="1"
                className="h-10"
                placeholder="30"
              />
            </div>
            <div>
              <Label>Distance (km)</Label>
              <Input
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                type="number"
                step="0.1"
                className="h-10"
                placeholder="5"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Sets</Label>
              <Input value={sets} onChange={(e) => setSets(e.target.value)} className="h-10" />
            </div>
            <div>
              <Label>Reps</Label>
              <Input value={reps} onChange={(e) => setReps(e.target.value)} className="h-10" />
            </div>
            <div>
              <Label>kg (opt)</Label>
              <Input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                type="number"
                step="0.5"
                className="h-10"
              />
            </div>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="rounded-full">
          <Plus /> Add to program
        </Button>
      </form>

      <ul className="flex flex-col gap-2">
        {rows.map((row, i) => (
          <li
            key={row.id}
            className="flex items-start gap-2 rounded-xl border border-border/80 bg-card px-3 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{row.exercise?.name}</p>
              <p className="text-sm text-muted-foreground">
                {row.exercise?.exercise_kind === "cardio" ? (
                  <>
                    {row.target_duration_min != null
                      ? `${row.target_duration_min} min`
                      : "—"}
                    {row.target_distance_km != null
                      ? ` · ${row.target_distance_km} km`
                      : ""}
                  </>
                ) : (
                  <>
                    {row.target_sets} × {row.target_reps}
                    {row.target_weight_kg != null
                      ? ` · ${row.target_weight_kg} kg`
                      : ""}
                  </>
                )}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={() => void move(i, -1)}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8"
                onClick={() => void move(i, 1)}
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-8 text-destructive"
                onClick={() =>
                  void removeProgramExercise(row.id).then(refresh)
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Link
        href="/fitness/programs"
        className={cn(buttonVariants({ variant: "outline" }), "mt-6 rounded-full")}
      >
        Back to programs
      </Link>
    </AppShell>
  );
}
