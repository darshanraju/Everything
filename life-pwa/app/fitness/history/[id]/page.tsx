"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { AppShell } from "@/components/shell/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatDurationClock,
  isCardioExercise,
  type SessionSet,
  type WorkoutSession,
} from "@/lib/schema";
import {
  formatDuration,
  getSession,
  listSessionSets,
  sessionVolume,
} from "@/modules/fitness/lib/sessions";

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sets, setSets] = useState<SessionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [s, ss] = await Promise.all([
          getSession(id),
          listSessionSets(id),
        ]);
        setSession(s);
        setSets(ss.filter((x) => x.completed));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, SessionSet[]>();
    for (const s of sets) {
      if (!map.has(s.exercise_id)) {
        order.push(s.exercise_id);
        map.set(s.exercise_id, []);
      }
      map.get(s.exercise_id)!.push(s);
    }
    return order.map((eid) => ({
      id: eid,
      name: map.get(eid)![0]?.exercise?.name ?? "Exercise",
      sets: map.get(eid)!,
    }));
  }, [sets]);

  if (loading) {
    return (
      <AppShell title="Session">
        <p className="text-muted-foreground">
          <Loader2 className="inline size-4 animate-spin" /> Loading…
        </p>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell title="Session">
        <p className="text-destructive">{error ?? "Not found"}</p>
        <Link href="/fitness/history" className={buttonVariants()}>
          Back
        </Link>
      </AppShell>
    );
  }

  const vol = sessionVolume(sets);

  return (
    <AppShell
      title={session.name || session.program?.name || "Workout"}
      subtitle={
        format(parseISO(session.started_at), "d MMM yyyy · HH:mm") +
        " · " +
        formatDuration(session.started_at, session.finished_at) +
        (vol > 0 ? ` · ${Math.round(vol)} kg volume` : "")
      }
    >
      {groups.length === 0 ? (
        <p className="text-muted-foreground">No completed sets logged.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <section
              key={g.id}
              className="rounded-2xl border border-border/80 bg-card p-4"
            >
              <h2 className="mb-2 font-bold">{g.name}</h2>
              <ul className="flex flex-col gap-1 text-sm">
                {g.sets.map((s) => (
                  <li key={s.id} className="text-muted-foreground">
                    {isCardioExercise(s.exercise) ? (
                      <>
                        Run:{" "}
                        <span className="font-semibold text-foreground">
                          {formatDurationClock(s.duration_seconds)}
                          {s.distance_km != null
                            ? ` · ${s.distance_km} km`
                            : ""}
                        </span>
                      </>
                    ) : (
                      <>
                        Set {s.set_index}:{" "}
                        <span className="font-semibold text-foreground">
                          {s.weight_kg != null ? `${s.weight_kg} kg` : "—"} ×{" "}
                          {s.reps ?? "—"}
                        </span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Link
        href="/fitness/history"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "mt-6 rounded-full"
        )}
      >
        Back to history
      </Link>
    </AppShell>
  );
}
