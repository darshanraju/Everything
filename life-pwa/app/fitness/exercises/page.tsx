"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { SubNav } from "@/components/shell/sub-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FITNESS_SUBNAV } from "@/modules/fitness/nav";
import { createExercise, listExercises } from "@/modules/fitness/lib/api";
import { MUSCLE_GROUPS, type Exercise } from "@/lib/schema";

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string>("all");
  const [name, setName] = useState("");
  const [muscle, setMuscle] = useState<string>("chest");
  const [kind, setKind] = useState<"strength" | "cardio">("strength");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setExercises(await listExercises());
  }

  useEffect(() => {
    void refresh()
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return exercises.filter((e) => {
      if (group !== "all" && e.muscle_group !== group) return false;
      if (q && !e.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [exercises, q, group]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createExercise(name, muscle, kind);
      setName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Exercises" subtitle="Library + custom movements">
      <SubNav items={FITNESS_SUBNAV} />

      <form
        onSubmit={onAdd}
        className="mb-5 flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4"
      >
        <p className="text-sm font-semibold">Add custom exercise</p>
        <div className="grid gap-2">
          <Label htmlFor="ex-name">Name</Label>
          <Input
            id="ex-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cable Kickback"
            className="h-11"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-2">
            <Label htmlFor="ex-kind">Type</Label>
            <select
              id="ex-kind"
              value={kind}
              onChange={(e) => {
                const k = e.target.value as "strength" | "cardio";
                setKind(k);
                if (k === "cardio") setMuscle("cardio");
              }}
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="strength">Strength (kg × reps)</option>
              <option value="cardio">Cardio (time + distance)</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ex-muscle">Muscle group</Label>
            <select
              id="ex-muscle"
              value={muscle}
              onChange={(e) => setMuscle(e.target.value)}
              className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
            >
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={saving || !name.trim()} className="rounded-full">
          {saving ? <Loader2 className="animate-spin" /> : <Plus />}
          Add exercise
        </Button>
      </form>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="h-10"
        />
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="all">All muscles</option>
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">
          <Loader2 className="inline size-4 animate-spin" /> Loading…
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((ex) => (
            <li
              key={ex.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-card px-4 py-3"
            >
              <span className="font-medium">{ex.name}</span>
              <div className="flex items-center gap-2">
                {ex.muscle_group && (
                  <Badge variant="secondary" className="capitalize">
                    {ex.muscle_group}
                  </Badge>
                )}
                {ex.exercise_kind === "cardio" && (
                  <Badge variant="outline" className="border-primary/40 text-primary">
                    Cardio
                  </Badge>
                )}
                {ex.is_custom && <Badge variant="outline">Custom</Badge>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
