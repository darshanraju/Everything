"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Loader2, Play } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { DesktopBoard, DesktopCard } from "@/components/shell/desktop-board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listCronJobsMeta } from "@/modules/crons/jobs-meta";
import {
  listLatestRunByJob,
  listRecentRuns,
} from "@/modules/crons/lib/api";
import type { CronJobMeta, CronRun } from "@/modules/crons/types";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "d MMM · h:mm a");
  } catch {
    return iso;
  }
}

function statusBadge(status: CronRun["status"] | "never") {
  if (status === "ok") {
    return (
      <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400">
        ok
      </Badge>
    );
  }
  if (status === "error") {
    return <Badge variant="destructive">error</Badge>;
  }
  if (status === "running") {
    return <Badge variant="outline">running</Badge>;
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      never
    </Badge>
  );
}

export function CronsPage() {
  const jobs = useMemo(() => listCronJobsMeta(), []);
  const [latestByJob, setLatestByJob] = useState<Map<string, CronRun>>(
    () => new Map()
  );
  const [recent, setRecent] = useState<CronRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [latest, runs] = await Promise.all([
      listLatestRunByJob(),
      listRecentRuns(20),
    ]);
    setLatestByJob(latest);
    setRecent(runs);
  }, []);

  useEffect(() => {
    void refresh()
      .catch((e) =>
        setError(
          e instanceof Error
            ? e.message
            : "Load failed — run migration 016_cron_runs.sql?"
        )
      )
      .finally(() => setLoading(false));
  }, [refresh]);

  async function onRun(job: CronJobMeta) {
    setRunningId(job.id);
    setError(null);
    try {
      const res = await fetch(`/api/crons/run/${encodeURIComponent(job.id)}`, {
        method: "POST",
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? `Run failed (${res.status})`);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setRunningId(null);
    }
  }

  const jobName = (id: string) =>
    jobs.find((j) => j.id === id)?.name ?? id;

  return (
    <AppShell
      layout="desktop"
      title="Crons"
      subtitle="Scheduled jobs · modular runners"
    >
      {error && (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </p>
      ) : (
        <DesktopBoard className="lg:grid-cols-2 xl:grid-cols-2">
          <DesktopCard title="Jobs">
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No jobs registered. Add one under{" "}
                <code className="text-xs">modules/crons/jobs/</code>.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {jobs.map((job) => {
                  const last = latestByJob.get(job.id);
                  const busy = runningId === job.id;
                  return (
                    <li
                      key={job.id}
                      className="rounded-lg border border-border/70 bg-card px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-semibold">{job.name}</p>
                            {job.enabled ? (
                              <Badge variant="secondary">enabled</Badge>
                            ) : (
                              <Badge variant="outline">disabled</Badge>
                            )}
                            {statusBadge(last?.status ?? "never")}
                          </div>
                          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                            {job.description}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {job.scheduleLabel}{" "}
                            <span className="font-mono opacity-70">
                              ({job.schedule})
                            </span>
                          </p>
                          {last && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              Last: {formatWhen(last.finished_at ?? last.started_at)}
                              {last.summary ? ` · ${last.summary}` : ""}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          className="shrink-0 rounded-full"
                          disabled={!job.enabled || busy}
                          onClick={() => void onRun(job)}
                        >
                          {busy ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Play className="size-3.5" />
                          )}
                          Run
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </DesktopCard>

          <DesktopCard title="Recent runs">
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No runs yet — hit Run on a job.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {recent.map((run) => (
                  <li
                    key={run.id}
                    className={cn(
                      "flex items-start justify-between gap-2 rounded-lg border border-border/60 px-2.5 py-2"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-medium">
                          {jobName(run.job_id)}
                        </span>
                        {statusBadge(run.status)}
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {run.triggered_by}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatWhen(run.started_at)}
                        {run.summary ? ` · ${run.summary}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DesktopCard>
        </DesktopBoard>
      )}
    </AppShell>
  );
}
