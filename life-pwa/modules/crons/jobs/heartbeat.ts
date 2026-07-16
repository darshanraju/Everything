import type { CronJob } from "@/modules/crons/types";

/**
 * Smoke-test job — proves runner + DB logging work.
 * Replace / extend with real jobs (e.g. amazon-fresh-deals) in later phases.
 */
export const heartbeatJob: CronJob = {
  id: "heartbeat",
  name: "Heartbeat",
  description: "Smoke test — confirms the cron runner and logging work.",
  schedule: "0 12 * * *",
  scheduleLabel: "Daily 12:00 UTC",
  enabled: true,
  async run() {
    return {
      ok: true,
      summary: "OK",
      detail: { at: new Date().toISOString() },
    };
  },
};
