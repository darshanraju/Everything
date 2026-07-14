"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { AppShell } from "@/components/shell/app-shell";
import { SubNav } from "@/components/shell/sub-nav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WorkoutSession } from "@/lib/schema";
import { FITNESS_SUBNAV } from "@/modules/fitness/nav";
import {
  formatDuration,
  listSessions,
} from "@/modules/fitness/lib/sessions";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listSessions(50)
      .then(setSessions)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="History" subtitle="Finished workouts">
      <SubNav items={FITNESS_SUBNAV} />

      {loading ? (
        <p className="text-muted-foreground">
          <Loader2 className="inline size-4 animate-spin" /> Loading…
        </p>
      ) : error ? (
        <p className="text-sm text-destructive">
          {error}
          <span className="mt-1 block text-xs opacity-80">
            Run migration 003_workout_sessions.sql if you haven’t.
          </span>
        </p>
      ) : sessions.length === 0 ? (
        <p className="text-muted-foreground">
          No finished workouts yet. Start one from Today.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link
                href={`/fitness/history/${s.id}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-auto w-full flex-col items-start gap-0.5 rounded-xl px-4 py-3 text-left"
                )}
              >
                <span className="font-semibold text-foreground">
                  {s.name || s.program?.name || "Workout"}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  {format(parseISO(s.started_at), "d MMM yyyy · HH:mm")} ·{" "}
                  {formatDuration(s.started_at, s.finished_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
