"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Pencil, Plus } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { HealthNav } from "@/modules/health/components/health-nav";
import { MacroTargetsSummary } from "@/modules/health/components/macro-progress";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatFoodMacros,
  sumFoodMacros,
  type Food,
  type MacroTargets,
} from "@/lib/schema";
import {
  getMacroTargets,
  listFoods,
  setFoodOnPlan,
} from "@/modules/health/lib/food";

export default function FoodLibraryPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [targets, setTargets] = useState<MacroTargets | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [list, t] = await Promise.all([listFoods(false), getMacroTargets()]);
    setFoods(list);
    setTargets(t);
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

  const planTotals = useMemo(
    () => sumFoodMacros(foods.filter((f) => f.on_plan)),
    [foods]
  );

  async function togglePlan(f: Food) {
    setBusyId(f.id);
    setError(null);
    try {
      const updated = await setFoodOnPlan(f.id, !f.on_plan);
      setFoods((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell
      title="Food library"
      subtitle="Build your daily plan"
      actions={
        <Link
          href="/health/food/library/new"
          className={cn(buttonVariants({ size: "sm" }), "rounded-full gap-1")}
        >
          <Plus className="size-4" /> New
        </Link>
      }
    >
      <HealthNav showFoodSecondary />

      {error && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {targets && (
            <MacroTargetsSummary targets={targets} planTotals={planTotals} />
          )}

          {foods.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center">
              <p className="font-medium">No foods yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Add meals or staples with macros, then put them on your plan.
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
              {foods.map((f) => (
                <li
                  key={f.id}
                  className="rounded-2xl border border-border/80 bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        {f.on_plan ? (
                          <Badge className="bg-primary/20 text-primary text-xs">
                            On plan
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Off plan
                          </Badge>
                        )}
                      </div>
                      <p className="font-bold">{f.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatFoodMacros(f)}
                      </p>
                      {f.notes && (
                        <p className="mt-1 text-xs text-muted-foreground/80">
                          {f.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/health/food/library/${f.id}`}
                      className={cn(
                        buttonVariants({ size: "sm", variant: "outline" }),
                        "rounded-full gap-1"
                      )}
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </Link>
                    <button
                      type="button"
                      disabled={busyId === f.id}
                      onClick={() => void togglePlan(f)}
                      className={cn(
                        buttonVariants({ size: "sm", variant: "ghost" }),
                        "rounded-full"
                      )}
                    >
                      {busyId === f.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : f.on_plan ? (
                        "Remove from plan"
                      ) : (
                        "Add to plan"
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </AppShell>
  );
}
