"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatFoodMacros, type Food } from "@/lib/schema";
import { listFoods, setFoodOnPlan } from "@/modules/health/lib/food";

type Props = {
  /** Food ids already on today's list (label as "Add again") */
  onPlanIds?: Set<string> | string[];
  /**
   * Called after ensuring the food is on-plan.
   * `alreadyOnPlan` is true when the food was already on today's list —
   * parent should log another serving so the same meal can count twice.
   */
  onAdded: (
    food: Food,
    meta: { alreadyOnPlan: boolean }
  ) => void | Promise<void>;
  placeholder?: string;
  className?: string;
};

export function FoodSearchAdd({
  onPlanIds,
  onAdded,
  placeholder = "Search foods to add today…",
  className,
}: Props) {
  const [allFoods, setAllFoods] = useState<Food[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const planSet = useMemo(() => {
    if (!onPlanIds) return new Set<string>();
    return onPlanIds instanceof Set ? onPlanIds : new Set(onPlanIds);
  }, [onPlanIds]);

  useEffect(() => {
    void listFoods(false)
      .then(setAllFoods)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Could not load foods")
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Searchable only — no full library dump on empty focus
    if (!q) return [];
    return allFoods
      .filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.notes?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 20);
  }, [allFoods, query]);

  async function selectFood(food: Food) {
    // planSet = already on today's list (not merely library on_plan flag)
    const alreadyOnPlan = planSet.has(food.id);
    setBusyId(food.id);
    setError(null);
    try {
      const updated = food.on_plan
        ? food
        : await setFoodOnPlan(food.id, true);
      // keep local list in sync
      setAllFoods((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f))
      );
      await onAdded(updated, { alreadyOnPlan });
      setQuery("");
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add food");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="h-11 pl-9 lg:h-8 lg:text-sm"
          autoComplete="off"
          disabled={loading}
        />
        {loading && (
          <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {open && !loading && (
        <ul className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-card py-1 shadow-lg">
          {allFoods.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted-foreground">
              No foods in library yet. Create one under Food → Library.
            </li>
          ) : !query.trim() ? (
            <li className="px-3 py-3 text-sm text-muted-foreground">
              Type to search your food library…
            </li>
          ) : matches.length === 0 ? (
            <li className="px-3 py-3 text-sm text-muted-foreground">
              No matches for “{query.trim()}”
            </li>
          ) : (
            matches.map((f) => {
              const already = planSet.has(f.id);
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    disabled={busyId === f.id}
                    onClick={() => void selectFood(f)}
                    className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm">{f.name}</span>
                      {busyId === f.id ? (
                        <Loader2 className="size-3.5 shrink-0 animate-spin" />
                      ) : already ? (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Add again
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Add
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatFoodMacros(f)}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
