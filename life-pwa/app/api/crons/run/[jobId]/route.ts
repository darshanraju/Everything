import { runJob } from "@/modules/crons/runner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorizeSchedule(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  // If no secret configured, allow (local dev). Production should set CRON_SECRET.
  if (!secret) return true;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

type Ctx = { params: Promise<{ jobId: string }> };

/**
 * GET — Vercel Cron / scheduled trigger (requires CRON_SECRET when set).
 * POST — Manual "Run now" from the Crons UI (personal app; no secret).
 */
export async function GET(request: Request, ctx: Ctx) {
  if (!authorizeSchedule(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = await ctx.params;
  try {
    const outcome = await runJob(jobId, "schedule");
    return Response.json({
      ok: outcome.result.ok,
      jobId,
      runId: outcome.run.id,
      status: outcome.run.status,
      summary: outcome.result.summary,
      detail: outcome.result.detail ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Run failed";
    console.error("[api/crons/run GET]", jobId, e);
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function POST(_request: Request, ctx: Ctx) {
  const { jobId } = await ctx.params;
  try {
    const outcome = await runJob(jobId, "manual");
    return Response.json({
      ok: outcome.result.ok,
      jobId,
      runId: outcome.run.id,
      status: outcome.run.status,
      summary: outcome.result.summary,
      detail: outcome.result.detail ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Run failed";
    console.error("[api/crons/run POST]", jobId, e);
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}
