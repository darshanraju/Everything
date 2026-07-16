import type { CronJob } from "@/modules/crons/types";
import { heartbeatJob } from "@/modules/crons/jobs/heartbeat";
import { amazonFreshDealsJob } from "@/modules/crons/jobs/amazon-fresh-deals";

/**
 * Server-only job registry (includes run implementations).
 * Client UI must use modules/crons/jobs-meta.ts instead.
 */
export const CRON_JOBS: CronJob[] = [heartbeatJob, amazonFreshDealsJob];

export function getCronJob(id: string): CronJob | undefined {
  return CRON_JOBS.find((j) => j.id === id);
}

export function listCronJobs(): CronJob[] {
  return CRON_JOBS;
}
