import { db } from "@/lib/supabase/client";
import type {
  AdhocMeal,
  Food,
  FoodLog,
  MacroTargets,
  MacroTotals,
} from "@/lib/schema";
import {
  caloriesFromMacros,
  emptyMacroTotals,
  sumFoodMacros,
} from "@/lib/schema";
import { format } from "date-fns";

const DEFAULT_TARGETS = {
  calories: 2000,
  protein_g: 150,
  carbs_g: 200,
  fat_g: 60,
};

function mapTargets(row: Record<string, unknown>): MacroTargets {
  return {
    id: row.id as string,
    calories: Number(row.calories),
    protein_g: Number(row.protein_g),
    carbs_g: Number(row.carbs_g),
    fat_g: Number(row.fat_g),
    updated_at: row.updated_at as string,
  };
}

function mapFood(row: Record<string, unknown>): Food {
  return {
    id: row.id as string,
    name: row.name as string,
    calories: Number(row.calories),
    protein_g: Number(row.protein_g),
    carbs_g: Number(row.carbs_g),
    fat_g: Number(row.fat_g),
    notes: (row.notes as string) ?? null,
    on_plan: Boolean(row.on_plan),
    sort_order: Number(row.sort_order ?? 0),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapLog(row: Record<string, unknown>): FoodLog {
  return {
    id: row.id as string,
    food_id: row.food_id as string,
    logged_on: row.logged_on as string,
    created_at: row.created_at as string,
  };
}

export function foodDateKey(d: Date = new Date()): string {
  return format(d, "yyyy-MM-dd");
}

/** Get targets; insert defaults if none exist. */
export async function getMacroTargets(): Promise<MacroTargets> {
  const { data, error } = await db()
    .from("macro_targets")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  if (data && data.length > 0) {
    return mapTargets(data[0] as Record<string, unknown>);
  }
  const { data: created, error: insertErr } = await db()
    .from("macro_targets")
    .insert({ ...DEFAULT_TARGETS })
    .select("*")
    .single();
  if (insertErr) throw insertErr;
  return mapTargets(created as Record<string, unknown>);
}

export async function updateMacroTargets(input: {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}): Promise<MacroTargets> {
  const current = await getMacroTargets();
  const { data, error } = await db()
    .from("macro_targets")
    .update({
      calories: input.calories,
      protein_g: input.protein_g,
      carbs_g: input.carbs_g,
      fat_g: input.fat_g,
      updated_at: new Date().toISOString(),
    })
    .eq("id", current.id)
    .select("*")
    .single();
  if (error) throw error;
  return mapTargets(data as Record<string, unknown>);
}

export async function listFoods(onPlanOnly = false): Promise<Food[]> {
  let q = db()
    .from("foods")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (onPlanOnly) q = q.eq("on_plan", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => mapFood(r as Record<string, unknown>));
}

export async function getFood(id: string): Promise<Food | null> {
  const { data, error } = await db()
    .from("foods")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapFood(data as Record<string, unknown>);
}

export type FoodInput = {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes?: string | null;
  on_plan?: boolean;
};

export async function createFood(input: FoodInput): Promise<Food> {
  const { data, error } = await db()
    .from("foods")
    .insert({
      name: input.name.trim(),
      calories: input.calories,
      protein_g: input.protein_g,
      carbs_g: input.carbs_g,
      fat_g: input.fat_g,
      notes: input.notes?.trim() || null,
      on_plan: input.on_plan ?? true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapFood(data as Record<string, unknown>);
}

export async function updateFood(id: string, input: FoodInput): Promise<Food> {
  const { data, error } = await db()
    .from("foods")
    .update({
      name: input.name.trim(),
      calories: input.calories,
      protein_g: input.protein_g,
      carbs_g: input.carbs_g,
      fat_g: input.fat_g,
      notes: input.notes?.trim() || null,
      on_plan: input.on_plan ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapFood(data as Record<string, unknown>);
}

export async function deleteFood(id: string): Promise<void> {
  const { error } = await db().from("foods").delete().eq("id", id);
  if (error) throw error;
}

export async function setFoodOnPlan(
  id: string,
  onPlan: boolean
): Promise<Food> {
  const { data, error } = await db()
    .from("foods")
    .update({ on_plan: onPlan, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapFood(data as Record<string, unknown>);
}

export async function listFoodLogsForDate(date: Date): Promise<FoodLog[]> {
  const day = foodDateKey(date);
  const { data, error } = await db()
    .from("food_logs")
    .select("*")
    .eq("logged_on", day)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapLog(r as Record<string, unknown>));
}

/** food_id set logged on date (unique foods, ignores multi-serving) */
export async function loggedFoodIdsForDate(date: Date): Promise<Set<string>> {
  const logs = await listFoodLogsForDate(date);
  return new Set(logs.map((l) => l.food_id));
}

/** Servings per food_id for a date (same meal can be logged more than once) */
export async function foodServingCountsForDate(
  date: Date
): Promise<Map<string, number>> {
  const logs = await listFoodLogsForDate(date);
  const counts = new Map<string, number>();
  for (const log of logs) {
    counts.set(log.food_id, (counts.get(log.food_id) ?? 0) + 1);
  }
  return counts;
}

/** Insert one serving log (allows multiple per food per day) */
export async function logFoodForDate(
  foodId: string,
  date: Date = new Date()
): Promise<void> {
  const day = foodDateKey(date);
  const { error } = await db()
    .from("food_logs")
    .insert({ food_id: foodId, logged_on: day });
  if (error) throw error;
}

/** Remove all servings of a food for the date */
export async function unlogFoodForDate(
  foodId: string,
  date: Date = new Date()
): Promise<void> {
  const day = foodDateKey(date);
  const { error } = await db()
    .from("food_logs")
    .delete()
    .eq("food_id", foodId)
    .eq("logged_on", day);
  if (error) throw error;
}

/** Remove a single (most recent) serving of a food for the date */
export async function unlogOneFoodForDate(
  foodId: string,
  date: Date = new Date()
): Promise<void> {
  const day = foodDateKey(date);
  const { data, error } = await db()
    .from("food_logs")
    .select("id")
    .eq("food_id", foodId)
    .eq("logged_on", day)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  const id = data?.[0]?.id as string | undefined;
  if (!id) return;
  const { error: delErr } = await db().from("food_logs").delete().eq("id", id);
  if (delErr) throw delErr;
}

export async function toggleFoodLog(
  foodId: string,
  currentlyLogged: boolean,
  date: Date = new Date()
): Promise<void> {
  if (currentlyLogged) await unlogFoodForDate(foodId, date);
  else await logFoodForDate(foodId, date);
}

/** Logs in date range for SLA (logged_on between from/to keys) */
export async function listFoodLogsBetween(
  fromKey: string,
  toKey: string
): Promise<FoodLog[]> {
  const { data, error } = await db()
    .from("food_logs")
    .select("*")
    .gte("logged_on", fromKey)
    .lte("logged_on", toKey);
  if (error) throw error;
  return (data ?? []).map((r) => mapLog(r as Record<string, unknown>));
}

function mapAdhoc(row: Record<string, unknown>): AdhocMeal {
  return {
    id: row.id as string,
    meal_label: row.meal_label as string,
    protein_g: Number(row.protein_g),
    carbs_g: Number(row.carbs_g),
    fat_g: Number(row.fat_g),
    calories: Number(row.calories),
    logged_on: row.logged_on as string,
    notes: (row.notes as string) ?? null,
    created_at: row.created_at as string,
  };
}

export async function listAdhocMealsForDate(
  date: Date = new Date()
): Promise<AdhocMeal[]> {
  const day = foodDateKey(date);
  const { data, error } = await db()
    .from("adhoc_meals")
    .select("*")
    .eq("logged_on", day)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapAdhoc(r as Record<string, unknown>));
}

export async function createAdhocMeal(input: {
  meal_label: string;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes?: string | null;
  date?: Date;
}): Promise<AdhocMeal> {
  const protein_g = Math.max(0, Number(input.protein_g) || 0);
  const carbs_g = Math.max(0, Number(input.carbs_g) || 0);
  const fat_g = Math.max(0, Number(input.fat_g) || 0);
  const calories = caloriesFromMacros(protein_g, carbs_g, fat_g);
  const { data, error } = await db()
    .from("adhoc_meals")
    .insert({
      meal_label: input.meal_label.trim() || "Other",
      protein_g,
      carbs_g,
      fat_g,
      calories,
      notes: input.notes?.trim() || null,
      logged_on: foodDateKey(input.date ?? new Date()),
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapAdhoc(data as Record<string, unknown>);
}

export async function deleteAdhocMeal(id: string): Promise<void> {
  const { error } = await db().from("adhoc_meals").delete().eq("id", id);
  if (error) throw error;
}

/** Sum macros of library servings + ad-hoc meals for a day. */
export async function getMacroTotalsForDate(
  date: Date = new Date()
): Promise<{
  targets: MacroTargets;
  current: MacroTotals;
}> {
  const [targets, logs, foods, adhoc] = await Promise.all([
    getMacroTargets(),
    listFoodLogsForDate(date),
    listFoods(false),
    listAdhocMealsForDate(date).catch(() => [] as AdhocMeal[]),
  ]);

  const byId = new Map(foods.map((f) => [f.id, f]));
  const eaten = logs
    .map((l) => byId.get(l.food_id))
    .filter((f): f is Food => Boolean(f));
  const fromLibrary = sumFoodMacros(eaten);

  const fromAdhoc = adhoc.reduce(
    (acc, m) => ({
      calories: acc.calories + Number(m.calories),
      protein_g: acc.protein_g + Number(m.protein_g),
      carbs_g: acc.carbs_g + Number(m.carbs_g),
      fat_g: acc.fat_g + Number(m.fat_g),
    }),
    emptyMacroTotals()
  );

  return {
    targets,
    current: {
      calories: fromLibrary.calories + fromAdhoc.calories,
      protein_g: fromLibrary.protein_g + fromAdhoc.protein_g,
      carbs_g: fromLibrary.carbs_g + fromAdhoc.carbs_g,
      fat_g: fromLibrary.fat_g + fromAdhoc.fat_g,
    },
  };
}
