import {
  CalendarNotConfiguredError,
  listEventsInRange,
} from "@/modules/calendar/lib/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/calendar/today?timeMin=...&timeMax=...
 * Client should pass local day bounds as ISO strings.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timeMin = searchParams.get("timeMin");
  const timeMax = searchParams.get("timeMax");

  if (!timeMin || !timeMax) {
    return Response.json(
      { events: [], error: "timeMin and timeMax are required" },
      { status: 200 }
    );
  }

  try {
    const events = await listEventsInRange(timeMin, timeMax);
    return Response.json({ events });
  } catch (e) {
    if (e instanceof CalendarNotConfiguredError) {
      return Response.json({ events: [], error: "not_configured" });
    }
    console.error("[api/calendar/today]", e);
    return Response.json({
      events: [],
      error: e instanceof Error ? e.message : "Calendar fetch failed",
    });
  }
}
