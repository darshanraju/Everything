"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Plus } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { HealthNav } from "@/modules/health/components/health-nav";
import {
  MacroProgress,
  MacroTargetsSummary,
} from "@/modules/health/components/macro-progress";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatFoodMacros,
  sumFoodMacros,
  type Food,
  type MacroTargets,
} from "@/lib/schema";
import {
  listFoods,
  loggedFoodIdsForDate,
  getMacroTargets,
  toggleFoodLog,
} from "@/modules/health/lib/food";

export function FoodTodayPage() {
  const [targets, setTargets] = useState<MacroTargets | null>(null);
  const [planFoods, setPlanFoods] = useState<Food[]>([]);
  const [loggedIds, setLoggedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [t, foods, logged] = await Promise.all([
      getMacroTargets(),
      listFoods(true),
      loggedFoodIdsForDate(new Date()),
    ]);
    setTargets(t);
    setPlanFoods(foods);
    setLoggedIds(logged);
  }, []);

  useEffect(() => {
    void refresh()
      .catch((e) =>
        setError(
          e instanceof Error
            ? e.message
            : "Load failed — run migration 010_food_macros.sql?"
        )
      )
      .finally(() => setLoading(false));
  }, [refresh]);

  const eatenFoods = useMemo(
    () => planFoods.filter((f) => loggedIds.has(f.id)),
    [planFoods, loggedIds]
  );
  const currentTotals = useMemo(
    () => sumFoodMacros(eatenFoods),
    [eatenFoods]
  );
  const planTotals = useMemo(() => sumFoodMacros(planFoods), [planFoods]);

  async function onToggle(food: Food) {
    const was = loggedIds.has(food.id);
    setBusyId(food.id);
    setError(null);
    // optimistic
    setLoggedIds((prev) => {
      const next = new Set(prev);
      if (was) next.delete(food.id);
      else next.add(food.id);
      return next;
    });
    try {
      await toggleFoodLog(food.id, was, new Date());
    } catch (e) {
      setLoggedIds((prev) => {
        const next = new Set(prev);
        if (was) next.add(food.id);
        else next.delete(food.id);
        return next;
      });
      setError(e instanceof Error ? e.message : "Could not update log");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell
      title="Food"
      subtitle="Macros · daily plan"
      actions={
        <Link
          href="/health/food/library/new"
          className={cn(buttonVariants({ size: "sm" }), "rounded-full gap-1")}
        >
          <Plus className="size-4" /> Food
        </Link>
      }
    >
      <HealthNav showFoodSecondary />

      {error && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading || !targets ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          <MacroTargetsSummary targets={targets} planTotals={planTotals} />
          <MacroProgress targets={targets} current={currentTotals} />

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Today&apos;s plan
              </h2>
              <span className="text-xs tabular-nums text-muted-foreground">
                {eatenFoods.length}/{planFoods.length} done
              </span>
            </div>

            {planFoods.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center">
                <p className="font-medium">No foods on your plan</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create foods with macros and mark them On plan.
                </p>
                <Link
                  href="/health/food/library/new"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "mt-4 rounded-full gap-1"
                  )}
                >
                  <Plus className="size-4" />
                  Add food
                </Link>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {planFoods.map((f) => {
                  const done = loggedIds.has(f.id);
                  return (
                    <li key={f.id}>
                      <button
                        type="button"
                        disabled={busyId === f.id}
                        onClick={() => void onToggle(f)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                          done
                            ? "border-primary/30 bg-primary/5"
                            : "border-border/80 bg-card hover:bg-muted/40"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                            done
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border"
                          )}
                        >
                          {busyId === f.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : done ? (
                            <Check className="size-3.5" />
                          ) : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block font-semibold",
                              done && "text-muted-foreground line-through"
                            )}
                          >
                            {f.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {formatFoodMacros(f)}
                          </span>
                          {f.notes && (
                            <span className="mt-1 block text-xs text-muted-foreground/80">
                              {f.notes}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
