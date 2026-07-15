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
 * Food → Today: each on-plan food until checked off that day.
 * Same food can be logged multiple times (servings) for macros.
 * SLA: unique foods completed / on-plan foods per day.
 */
export const foodTodayContributor: TodayContributor = {
  sourceKey: "food",
  label: "Food",
  enabled: true,

  async getItems(date: Date): Promise<TodayItem[]> {
    const [foods, counts] = await Promise.all([
      listFoods(true),
      foodServingCountsForDate(date),
    ]);

    const items: TodayItem[] = foods.map((f, index) => {
      const servings = counts.get(f.id) ?? 0;
      const done = servings > 0;
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
      return {
        id: `food:item:${f.id}`,
        sourceKey: "food",
        title: servings > 1 ? `${f.name} ×${servings}` : f.name,
        subtitle,
        href: "/health/food",
        status: done ? "done" : "pending",
        sortOrder: index,
        completeAction: "toggle",
        meta: { foodId: f.id, isDone: done, servings },
      };
    });

    items.sort((a, b) => {
      if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
    return items;
  },

  async completeItem(item) {
    const foodId = item.meta?.foodId as string | undefined;
    if (!foodId) return;
    const currentlyDone = item.status === "done";
    await toggleFoodLog(foodId, currentlyDone, new Date());
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
