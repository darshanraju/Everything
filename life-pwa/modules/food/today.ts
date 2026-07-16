import type {
  DayScore,
  TodayContributor,
  TodayItem,
} from "@/modules/today/types";
import {
  listFoods,
  listFoodLogsBetween,
  foodServingCountsForDate,
  toggleFoodLog,
} from "@/modules/health/lib/food";
import { formatFoodMacros } from "@/lib/schema";
import { dateKey, eachLocalDay } from "@/modules/today/dates";
import { format } from "date-fns";

/**
 * Food → Today: only foods actually logged (eaten) today.
 * Add via search; same food can be logged multiple times (servings).
 * Toggle removes today's log for that food.
 * SLA: unique foods completed / on-plan foods per day (Health plan).
 */
export const foodTodayContributor: TodayContributor = {
  sourceKey: "food",
  label: "Food",
  enabled: true,

  async getItems(date: Date): Promise<TodayItem[]> {
    const counts = await foodServingCountsForDate(date);
    if (counts.size === 0) return [];

    const foods = await listFoods(false);
    const items: TodayItem[] = [];

    for (const f of foods) {
      const servings = counts.get(f.id) ?? 0;
      if (servings === 0) continue;
      const unitMacros = formatFoodMacros(f);
      const subtitle =
        servings > 1
          ? `${formatFoodMacros({
              calories: f.calories * servings,
              protein_g: f.protein_g * servings,
              carbs_g: f.carbs_g * servings,
              fat_g: f.fat_g * servings,
            })} · ×${servings}`
          : unitMacros;
      items.push({
        id: `food:item:${f.id}`,
        sourceKey: "food",
        title: servings > 1 ? `${f.name} ×${servings}` : f.name,
        subtitle,
        href: "/health/food",
        status: "done",
        sortOrder: items.length,
        completeAction: "toggle",
        meta: { foodId: f.id, isDone: true, servings },
      });
    }

    items.sort((a, b) => a.title.localeCompare(b.title));
    return items;
  },

  async completeItem(item) {
    const foodId = item.meta?.foodId as string | undefined;
    if (!foodId) return;
    // Only logged foods appear here — toggle always clears today's servings
    await toggleFoodLog(foodId, true, new Date());
  },

  async getDayScores(from: Date, to: Date): Promise<DayScore[]> {
    const foods = await listFoods(true);
    const expected = foods.length;
    const foodIds = new Set(foods.map((f) => f.id));

    if (expected === 0) {
      return eachLocalDay(from, to).map((d) => ({
        date: dateKey(d),
        expected: 0,
        completed: 0,
      }));
    }

    const fromKey = dateKey(from);
    const toKey = dateKey(to);
    const logs = await listFoodLogsBetween(fromKey, toKey);

    const byDay = new Map<string, Set<string>>();
    for (const log of logs) {
      if (!foodIds.has(log.food_id)) continue;
      const set = byDay.get(log.logged_on) ?? new Set();
      set.add(log.food_id);
      byDay.set(log.logged_on, set);
    }

    return eachLocalDay(from, to).map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const set = byDay.get(key);
      return {
        date: key,
        expected,
        completed: set?.size ?? 0,
      };
    });
  },
};
