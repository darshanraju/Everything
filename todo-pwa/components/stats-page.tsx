"use client";

import { useEffect, useState } from "react";
import { Flame, CheckCircle2, CalendarDays, Loader2 } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { ConsistencyChart } from "@/components/consistency-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { computeConsistency, listTasks, type ConsistencyStats } from "@/lib/tasks";

export function StatsPage() {
  const [stats, setStats] = useState<ConsistencyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const tasks = await listTasks();
        setStats(computeConsistency(tasks, 30));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load stats");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      <AppNav />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-6 pb-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stats</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            How consistent you are at finishing tasks.
          </p>
        </div>

        {loading ? (
          <p className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Loading…
          </p>
        ) : error ? (
          <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-border/80 bg-card">
                <CardHeader className="gap-2 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="size-4 text-primary" />
                    <CardDescription className="text-xs font-semibold">
                      Today
                    </CardDescription>
                  </div>
                  <CardTitle className="text-3xl font-bold tabular-nums text-primary">
                    {stats.completedToday}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-border/80 bg-card">
                <CardHeader className="gap-2 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Flame className="size-4 text-orange-400" />
                    <CardDescription className="text-xs font-semibold">
                      Streak
                    </CardDescription>
                  </div>
                  <CardTitle className="text-3xl font-bold tabular-nums">
                    {stats.streak}
                    <span className="ml-1 text-base font-semibold text-muted-foreground">
                      day{stats.streak === 1 ? "" : "s"}
                    </span>
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="col-span-2 border-border/80 bg-card">
                <CardHeader className="gap-2 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="size-4 text-primary" />
                    <CardDescription className="text-xs font-semibold">
                      This week · open vs done
                    </CardDescription>
                  </div>
                  <CardTitle className="text-xl font-bold">
                    <span className="text-primary">{stats.completedThisWeek}</span>
                    <span className="text-muted-foreground"> completed</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span>{stats.totalOpen}</span>
                    <span className="text-muted-foreground"> open</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    <span>{stats.totalDone}</span>
                    <span className="text-muted-foreground"> done total</span>
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card className="border-border/80 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">
                  Completions (last 14 days)
                </CardTitle>
                <CardDescription>
                  Tasks checked off per day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConsistencyChart days={stats.days} />
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
    </>
  );
}
