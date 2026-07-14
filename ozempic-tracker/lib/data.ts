import { createClient } from "@/lib/supabase/server";
import {
  SUPABASE_SCHEMA,
  SCALE_PHOTOS_BUCKET,
  type Profile,
  type WeeklyLog,
} from "@/lib/schema";
import { DEFAULT_TZ } from "@/lib/weeks";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function ensureProfile(userId: string): Promise<Profile> {
  const supabase = await createClient();
  const db = supabase.schema(SUPABASE_SCHEMA);

  const { data: existing } = await db
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return existing as Profile;

  const { data: created, error } = await db
    .from("profiles")
    .insert({
      user_id: userId,
      timezone: DEFAULT_TZ,
      reminder_weekday: 6,
    })
    .select("*")
    .single();

  if (error) {
    // Race: another request may have created it
    const { data: retry } = await db
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (retry) return retry as Profile;
    throw error;
  }

  return created as Profile;
}

export async function getWeeklyLogs(userId: string): Promise<WeeklyLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema(SUPABASE_SCHEMA)
    .from("weekly_logs")
    .select("*")
    .eq("user_id", userId)
    .order("week_of", { ascending: false });

  if (error) throw error;
  return (data ?? []) as WeeklyLog[];
}

export async function getLogForWeek(
  userId: string,
  weekOf: string
): Promise<WeeklyLog | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema(SUPABASE_SCHEMA)
    .from("weekly_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("week_of", weekOf)
    .maybeSingle();

  if (error) throw error;
  return data as WeeklyLog | null;
}

export async function getSignedPhotoUrl(
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(SCALE_PHOTOS_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error) return null;
  return data.signedUrl;
}

export function weightDeltas(logsAsc: WeeklyLog[]) {
  if (logsAsc.length === 0) {
    return { latest: null, prevDelta: null, totalDelta: null };
  }
  const latest = logsAsc[logsAsc.length - 1];
  const first = logsAsc[0];
  const prev = logsAsc.length > 1 ? logsAsc[logsAsc.length - 2] : null;
  const latestW = Number(latest.weight_kg);
  const firstW = Number(first.weight_kg);
  const prevW = prev ? Number(prev.weight_kg) : null;

  return {
    latest: latestW,
    prevDelta: prevW !== null ? latestW - prevW : null,
    totalDelta: latestW - firstW,
  };
}
