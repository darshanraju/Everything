import { getCronJob } from "@/modules/crons/registry";
import {
  finishRun,
  insertRunningRun,
} from "@/modules/crons/lib/api";
import type { CronJobResult, CronRun, CronTriggeredBy } from "@/modules/crons/types";

export type RunJobOutcome = {
  run: CronRun;
  result: CronJobResult;
};

/**
 * Execute a registered job and persist run history.
 */
export async function runJob(
  jobId: string,
  triggeredBy: CronTriggeredBy
): Promise<RunJobOutcome> {
  const job = getCronJob(jobId);
  if (!job) {
    throw new Error(`Unknown job: ${jobId}`);
  }
  if (!job.enabled) {
    throw new Error(`Job is disabled: ${jobId}`);
  }

  const run = await insertRunningRun(jobId, triggeredBy);

  try {
    const result = await job.run();
    const finished = await finishRun(
      run.id,
      result.ok ? "ok" : "error",
      result.summary,
      result.detail
    );
    return { run: finished, result };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Job threw";
    const finished = await finishRun(run.id, "error", message, {
      error: message,
    });
    return {
      run: finished,
      result: { ok: false, summary: message },
    };
  }
}
