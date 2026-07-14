"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Moon, Dumbbell, Play } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { SubNav } from "@/components/shell/sub-nav";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  WEEKDAYS,
  type ProgramExercise,
  type WeeklyPlanDay,
  type WorkoutSession,
} from "@/lib/schema";
import { FITNESS_SUBNAV } from "@/modules/fitness/nav";
import {
  getWeeklyPlan,
  listProgramExercises,
  todayWeekday,
} from "@/modules/fitness/lib/api";
import {
  getActiveSession,
  startSession,
} from "@/modules/fitness/lib/sessions";

export default function FitnessHomePage() {
  const router = useRouter();
  const [day, setDay] = useState<WeeklyPlanDay | null>(null);
  const [exercises, setExercises] = useState<ProgramExercise[]>([]);
  const [active, setActive] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const weekday = todayWeekday();

  useEffect(() => {
    void (async () => {
      try {
        const [plan, act] = await Promise.all([
          getWeeklyPlan(),
          getActiveSession(),
        ]);
        setActive(act);
        const today = plan.find((d) => d.weekday === weekday) ?? null;
        setDay(today);
        if (today?.program_id && !today.is_rest) {
          setExercises(await listProgramExercises(today.program_id));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load plan");
      } finally {
        setLoading(false);
      }
    })();
  }, [weekday]);

  async function onStart() {
    setStarting(true);
    setError(null);
    try {
      if (active) {
        router.push(`/fitness/workout/${active.id}`);
        return;
      }
      const hasProgram = day?.program_id && !day.is_rest && day.program;
      const session = await startSession({
        program_id: hasProgram ? day!.program_id : null,
        name: hasProgram ? day!.program!.name : "Empty workout",
        programExercises: hasProgram ? exercises : [],
      });
      router.push(`/fitness/workout/${session.id}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not start workout — run migration 003 if needed"
      );
      setStarting(false);
    }
  }

  const label = WEEKDAYS.find((w) => w.value === weekday)?.label ?? "";

  return (
    <AppShell title="Fitness" subtitle={`${label} · plan for today`}>
      <SubNav items={FITNESS_SUBNAV} />

      {loading ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </p>
      ) : error && !day ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
          <span className="mt-1 block text-xs opacity-80">
            Run the life_hub migrations and expose the schema in Supabase.
          </span>
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {active && (
            <Card className="border-amber-500/40 bg-amber-500/10">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-amber-100">
                    Workout in progress
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {active.name || "Live session"}
                  </p>
                </div>
                <Button
                  className="rounded-full"
                  onClick={() => router.push(`/fitness/workout/${active.id}`)}
                >
                  Resume
                </Button>
              </CardContent>
            </Card>
          )}

          {day?.is_rest || !day?.program ? (
            <Card className="border-border/80">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <Moon className="size-10 text-muted-foreground" />
                <p className="text-lg font-semibold">Rest day</p>
                <p className="text-sm text-muted-foreground">
                  No program scheduled — or start an empty workout.
                </p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  <Button
                    size="lg"
                    className="rounded-full"
                    disabled={starting}
                    onClick={() => void onStart()}
                  >
                    {starting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Play className="size-4" />
                    )}
                    {active ? "Resume workout" : "Start empty workout"}
                  </Button>
                  <Link
                    href="/fitness/week"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "rounded-full"
                    )}
                  >
                    Edit weekly plan
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="border-primary/25 bg-primary/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Dumbbell className="size-5" />
                    <CardTitle className="text-xl">{day.program.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {exercises.length} exercise
                  {exercises.length === 1 ? "" : "s"} prescribed
                </CardContent>
              </Card>

              <Button
                size="lg"
                className="h-12 w-full rounded-full text-base font-bold"
                disabled={starting}
                onClick={() => void onStart()}
              >
                {starting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Play className="size-5" />
                )}
                {active ? "Resume workout" : "Start workout"}
              </Button>

              <ul className="flex flex-col gap-2">
                {exercises.map((pe) => (
                  <li
                    key={pe.id}
                    className="rounded-xl border border-border/80 bg-card px-4 py-3"
                  >
                    <p className="font-semibold">
                      {pe.exercise?.name ?? "Exercise"}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {pe.exercise?.exercise_kind === "cardio" ? (
                        <>
                          {pe.target_duration_min != null
                            ? `${pe.target_duration_min} min`
                            : "—"}
                          {pe.target_distance_km != null
                            ? ` · ${pe.target_distance_km} km`
                            : ""}
                        </>
                      ) : (
                        <>
                          {pe.target_sets} × {pe.target_reps}
                          {pe.target_weight_kg != null
                            ? ` · ${pe.target_weight_kg} kg`
                            : ""}
                        </>
                      )}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/fitness/programs/${day.program_id}`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "rounded-full"
                  )}
                >
                  Edit program
                </Link>
                <Link
                  href="/fitness/week"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "rounded-full"
                  )}
                >
                  Change week
                </Link>
                <Link
                  href="/fitness/history"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "rounded-full"
                  )}
                >
                  History
                </Link>
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </AppShell>
  );
}
