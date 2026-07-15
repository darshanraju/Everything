/** App schema — see agents.md. Never use public. */
export const SUPABASE_SCHEMA = "life_hub" as const;

export type ExerciseKind = "strength" | "cardio";

export type Exercise = {
  id: string;
  name: string;
  muscle_group: string | null;
  is_custom: boolean;
  /** strength = kg/reps; cardio = duration + distance (e.g. Running) */
  exercise_kind: ExerciseKind;
  created_at: string;
};

export type Program = {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProgramExercise = {
  id: string;
  program_id: string;
  exercise_id: string;
  sort_order: number;
  target_sets: number;
  target_reps: string;
  target_weight_kg: number | null;
  /** Cardio prescription */
  target_duration_min: number | null;
  target_distance_km: number | null;
  exercise?: Exercise;
};

export type WeeklyPlanDay = {
  weekday: number; // 0=Mon … 6=Sun
  program_id: string | null;
  is_rest: boolean;
  program?: Program | null;
};

export type BodyWeight = {
  id: string;
  weighed_on: string;
  weight_kg: number;
  notes: string | null;
  created_at: string;
};

export type HealthCategory =
  | "peptide"
  | "medicine"
  | "skincare"
  | "supplement"
  | "other";

/** DB table is still peptide_protocols; app treats these as generic protocols */
export type HealthProtocol = {
  id: string;
  name: string;
  category: HealthCategory;
  amount: number | null;
  unit: string;
  /** Units to draw on a standard 1 ml (U-100) insulin syringe (peptides) */
  syringe_units: number | null;
  frequency: string;
  frequency_note: string | null;
  /**
   * Weekdays when due for weekly/custom: 0=Mon … 6=Sun.
   * null/empty = no day filter (legacy / daily).
   */
  schedule_weekdays: number[] | null;
  active: boolean;
  notes: string | null;
  created_at: string;
};

export type HealthLog = {
  id: string;
  protocol_id: string;
  taken_at: string;
  amount: number | null;
  notes: string | null;
  protocol?: HealthProtocol;
};

/** @deprecated use HealthProtocol */
export type PeptideProtocol = HealthProtocol;
/** @deprecated use HealthLog */
export type PeptideLog = HealthLog;

export const HEALTH_CATEGORIES: {
  value: HealthCategory;
  label: string;
}[] = [
  { value: "medicine", label: "Medicine" },
  { value: "peptide", label: "Peptide" },
  { value: "skincare", label: "Skincare" },
  { value: "supplement", label: "Supplement" },
  { value: "other", label: "Other" },
];

export function categoryLabel(category: string | null | undefined): string {
  return (
    HEALTH_CATEGORIES.find((c) => c.value === category)?.label ??
    category ??
    "Other"
  );
}

/** Health → Surgery procedure status pipeline */
export type SurgeryStatus =
  | "new"
  | "consulting"
  | "price_found"
  | "booked"
  | "completed";

export type Surgery = {
  id: string;
  title: string;
  location: string | null;
  notes: string | null;
  status: SurgeryStatus;
  cost: number | null;
  created_at: string;
  updated_at: string;
};

export const SURGERY_STATUSES: {
  value: SurgeryStatus;
  label: string;
}[] = [
  { value: "new", label: "New" },
  { value: "consulting", label: "Consulting" },
  { value: "price_found", label: "Price found" },
  { value: "booked", label: "Booked" },
  { value: "completed", label: "Completed" },
];

export function surgeryStatusLabel(
  status: string | null | undefined
): string {
  return (
    SURGERY_STATUSES.find((s) => s.value === status)?.label ??
    status ??
    "New"
  );
}

/** Daily macro targets (Health → Food) */
export type MacroTargets = {
  id: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  updated_at: string;
};

/** Food library item */
export type Food = {
  id: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes: string | null;
  on_plan: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type FoodLog = {
  id: string;
  food_id: string;
  logged_on: string;
  created_at: string;
};

export type MacroTotals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export function emptyMacroTotals(): MacroTotals {
  return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
}

/** Atwater factors: 4 kcal/g protein, 4 carbs, 9 fat */
export function caloriesFromMacros(
  protein_g: number,
  carbs_g: number,
  fat_g: number
): number {
  return Math.round(4 * protein_g + 4 * carbs_g + 9 * fat_g);
}

export type MealLabel =
  | "Breakfast"
  | "Lunch"
  | "Dinner"
  | "Snack"
  | "Other";

export const MEAL_LABELS: MealLabel[] = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Other",
];

/** One-off macros for a day (not food library) */
export type AdhocMeal = {
  id: string;
  meal_label: string;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  calories: number;
  logged_on: string;
  notes: string | null;
  created_at: string;
};

export function sumFoodMacros(foods: Pick<Food, "calories" | "protein_g" | "carbs_g" | "fat_g">[]): MacroTotals {
  return foods.reduce(
    (acc, f) => ({
      calories: acc.calories + Number(f.calories),
      protein_g: acc.protein_g + Number(f.protein_g),
      carbs_g: acc.carbs_g + Number(f.carbs_g),
      fat_g: acc.fat_g + Number(f.fat_g),
    }),
    emptyMacroTotals()
  );
}

export function formatFoodMacros(f: Pick<Food, "calories" | "protein_g" | "carbs_g" | "fat_g">): string {
  return `${Math.round(Number(f.calories))} kcal · ${Math.round(Number(f.protein_g))}P · ${Math.round(Number(f.carbs_g))}C · ${Math.round(Number(f.fat_g))}F`;
}

export type WorkoutSession = {
  id: string;
  program_id: string | null;
  name: string | null;
  started_at: string;
  finished_at: string | null;
  notes: string | null;
  created_at: string;
  program?: Program | null;
  sets?: SessionSet[];
};

export type SessionSet = {
  id: string;
  session_id: string;
  exercise_id: string;
  set_index: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  /** Cardio: duration in seconds */
  duration_seconds: number | null;
  /** Cardio: distance in km */
  distance_km: number | null;
  completed: boolean;
  created_at: string;
  exercise?: Exercise;
};

/** Previous session performance for ghost sets */
export type GhostSet = {
  set_index: number;
  weight_kg: number | null;
  reps: number | null;
  duration_seconds: number | null;
  distance_km: number | null;
};

export function isCardioExercise(ex?: Exercise | null): boolean {
  return ex?.exercise_kind === "cardio";
}

/** Format seconds as m:ss or h:mm:ss */
export function formatDurationClock(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return "—";
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** Parse "mm:ss" or "m" or total minutes as number string → seconds */
export function parseDurationToSeconds(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  if (t.includes(":")) {
    const parts = t.split(":").map((p) => Number(p));
    if (parts.some((n) => Number.isNaN(n))) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  }
  const mins = Number(t);
  if (Number.isNaN(mins) || mins < 0) return null;
  return Math.round(mins * 60);
}

export const WEEKDAYS = [
  { value: 0, label: "Monday", short: "Mon" },
  { value: 1, label: "Tuesday", short: "Tue" },
  { value: 2, label: "Wednesday", short: "Wed" },
  { value: 3, label: "Thursday", short: "Thu" },
  { value: 4, label: "Friday", short: "Fri" },
  { value: 5, label: "Saturday", short: "Sat" },
  { value: 6, label: "Sunday", short: "Sun" },
] as const;

export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
  "full_body",
  "cardio",
] as const;

export const PEPTIDE_FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "eod", label: "Every other day" },
  { value: "weekly", label: "Weekly" },
  { value: "custom", label: "Custom" },
] as const;

/** Tags for the Shared links inbox */
export type SharedLinkTag =
  | "learning"
  | "fun"
  | "work"
  | "reference"
  | "other";

export type SharedLink = {
  id: string;
  url: string;
  title: string;
  tag: SharedLinkTag | string;
  share_text: string | null;
  created_at: string;
  updated_at: string;
};

/** Personal notepad (feature ideas, etc.) */
export type Note = {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
  updated_at: string;
};

export const SHARED_LINK_TAGS: {
  value: SharedLinkTag;
  label: string;
}[] = [
  { value: "learning", label: "Learning" },
  { value: "fun", label: "Fun" },
  { value: "work", label: "Work" },
  { value: "reference", label: "Reference" },
  { value: "other", label: "Other" },
];

export function sharedTagLabel(tag: string | null | undefined): string {
  return (
    SHARED_LINK_TAGS.find((t) => t.value === tag)?.label ?? tag ?? "Other"
  );
}
