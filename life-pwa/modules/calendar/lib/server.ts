/**
 * Server-only Google Calendar helpers (refresh token + events.list).
 * Credentials stay in env — never expose to the client.
 */

export type CalendarEventDto = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string;
  htmlLink?: string;
};

export class CalendarNotConfiguredError extends Error {
  constructor() {
    super("Google Calendar is not configured");
    this.name = "CalendarNotConfiguredError";
  }
}

function requiredEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new CalendarNotConfiguredError();
  return v;
}

export function isCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_REFRESH_TOKEN?.trim()
  );
}

async function getAccessToken(): Promise<string> {
  const clientId = requiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = requiredEnv("GOOGLE_CLIENT_SECRET");
  const refreshToken = requiredEnv("GOOGLE_REFRESH_TOKEN");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Google token refresh failed (${res.status}): ${text.slice(0, 200)}`
    );
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error("Google token refresh returned no access_token");
  }
  return json.access_token;
}

type GCalEvent = {
  id?: string;
  status?: string;
  summary?: string;
  location?: string;
  htmlLink?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  attendees?: Array<{ self?: boolean; responseStatus?: string }>;
};

/**
 * List events between timeMin and timeMax (RFC3339 ISO strings from the client).
 * Client should pass local day bounds so timezone is correct.
 */
export async function listEventsInRange(
  timeMin: string,
  timeMax: string
): Promise<CalendarEventDto[]> {
  if (!isCalendarConfigured()) {
    throw new CalendarNotConfiguredError();
  }

  const accessToken = await getAccessToken();
  const calendarId = encodeURIComponent(
    process.env.GOOGLE_CALENDAR_ID?.trim() || "primary"
  );

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Google Calendar list failed (${res.status}): ${text.slice(0, 200)}`
    );
  }

  const json = (await res.json()) as { items?: GCalEvent[] };
  const items = json.items ?? [];
  const out: CalendarEventDto[] = [];

  for (const ev of items) {
    if (!ev.id) continue;
    if (ev.status === "cancelled") continue;

    const selfAttendee = ev.attendees?.find((a) => a.self);
    if (selfAttendee?.responseStatus === "declined") continue;

    const allDay = Boolean(ev.start?.date && !ev.start?.dateTime);
    const start = ev.start?.dateTime ?? ev.start?.date;
    const end = ev.end?.dateTime ?? ev.end?.date;
    if (!start || !end) continue;

    out.push({
      id: ev.id,
      title: (ev.summary ?? "").trim() || "Untitled event",
      start,
      end,
      allDay,
      location: ev.location?.trim() || undefined,
      htmlLink: ev.htmlLink || undefined,
    });
  }

  return out;
}
