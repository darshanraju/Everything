import { db } from "@/lib/supabase/client";
import type { CronRun, CronRunStatus, CronTriggeredBy } from "@/modules/crons/types";

function mapRun(row: Record<string, unknown>): CronRun {
  return {
    id: row.id as string,
    job_id: row.job_id as string,
    status: row.status as CronRunStatus,
    summary: (row.summary as string) ?? null,
    detail: (row.detail as Record<string, unknown>) ?? null,
    triggered_by: row.triggered_by as CronTriggeredBy,
    started_at: row.started_at as string,
    finished_at: (row.finished_at as string) ?? null,
    created_at: row.created_at as string,
  };
}

export async function listRecentRuns(limit = 20): Promise<CronRun[]> {
  const { data, error } = await db()
    .from("cron_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => mapRun(r as Record<string, unknown>));
}

export async function listLatestRunByJob(): Promise<Map<string, CronRun>> {
  // Fetch a window of recent runs and keep first (latest) per job_id
  const { data, error } = await db()
    .from("cron_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  const map = new Map<string, CronRun>();
  for (const row of data ?? []) {
    const run = mapRun(row as Record<string, unknown>);
    if (!map.has(run.job_id)) map.set(run.job_id, run);
  }
  return map;
}

export async function insertRunningRun(
  jobId: string,
  triggeredBy: CronTriggeredBy
): Promise<CronRun> {
  const { data, error } = await db()
    .from("cron_runs")
    .insert({
      job_id: jobId,
      status: "running",
      triggered_by: triggeredBy,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapRun(data as Record<string, unknown>);
}

export async function finishRun(
  runId: string,
  status: "ok" | "error",
  summary: string,
  detail?: Record<string, unknown>
): Promise<CronRun> {
  const { data, error } = await db()
    .from("cron_runs")
    .update({
      status,
      summary,
      detail: detail ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId)
    .select("*")
    .single();
  if (error) throw error;
  return mapRun(data as Record<string, unknown>);
}
