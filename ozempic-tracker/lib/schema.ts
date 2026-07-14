/** App schema — see agents.md multi-app strategy. Never use public. */
export const SUPABASE_SCHEMA = "ozempic_tracker" as const;

export const SCALE_PHOTOS_BUCKET = "ozempic-scale-photos" as const;

export type Profile = {
  user_id: string;
  display_name: string | null;
  reminder_weekday: number;
  timezone: string;
  created_at: string;
};

export type WeeklyLog = {
  id: string;
  user_id: string;
  week_of: string; // YYYY-MM-DD (Saturday)
  took_ozempic: boolean;
  weight_kg: number;
  scale_photo_path: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
