import type { CronJobMeta } from "@/modules/crons/types";

/**
 * Client-safe job list (no run implementations).
 * Keep in sync with modules/crons/registry.ts.
 */
export const CRON_JOBS_META: CronJobMeta[] = [
  {
    id: "heartbeat",
    name: "Heartbeat",
    description: "Smoke test — confirms the cron runner and logging work.",
    schedule: "0 12 * * *",
    scheduleLabel: "Daily 12:00 UTC",
    enabled: true,
  },
  {
    id: "amazon-fresh-deals",
    name: "Amazon Fresh deals",
    description:
      "Scan 2 Fresh links for ≥50% off; add deals to Today todos with links.",
    schedule: "0 14 * * *",
    scheduleLabel: "Daily 7:00 AM PT (14:00 UTC)",
    enabled: true,
  },
];

export function listCronJobsMeta(): CronJobMeta[] {
  return CRON_JOBS_META;
}

export function getCronJobMeta(id: string): CronJobMeta | undefined {
  return CRON_JOBS_META.find((j) => j.id === id);
}
