/**
 * Modular cron jobs — register in modules/crons/registry.ts.
 * Definitions live in code; run history is in life_hub.cron_runs.
 */

export type CronJobResult = {
  ok: boolean;
  summary: string;
  detail?: Record<string, unknown>;
};

/** Client-safe job metadata (no run function). */
export type CronJobMeta = {
  /** Stable id: "heartbeat", "amazon-fresh-deals" */
  id: string;
  name: string;
  description: string;
  /** Cron expression for Vercel, e.g. "0 12 * * *" */
  schedule: string;
  scheduleLabel: string;
  enabled: boolean;
};

export type CronJob = CronJobMeta & {
  run: () => Promise<CronJobResult>;
};

export type CronTriggeredBy = "manual" | "schedule";

export type CronRunStatus = "running" | "ok" | "error";

export type CronRun = {
  id: string;
  job_id: string;
  status: CronRunStatus;
  summary: string | null;
  detail: Record<string, unknown> | null;
  triggered_by: CronTriggeredBy;
  started_at: string;
  finished_at: string | null;
  created_at: string;
};
