"use client";

import { useMemo, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  MEAL_LABELS,
  caloriesFromMacros,
  type AdhocMeal,
  type MealLabel,
} from "@/lib/schema";
import {
  createAdhocMeal,
  deleteAdhocMeal,
} from "@/modules/health/lib/food";

type Props = {
  meals: AdhocMeal[];
  onChanged: () => void | Promise<void>;
  compact?: boolean;
};

export function AdhocMealForm({ meals, onChanged, compact }: Props) {
  const [label, setLabel] = useState<MealLabel>("Breakfast");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(!compact);

  const p = Number(protein) || 0;
  const c = Number(carbs) || 0;
  const f = Number(fat) || 0;
  const kcal = useMemo(() => caloriesFromMacros(p, c, f), [p, c, f]);
  const canSave = p > 0 || c > 0 || f > 0;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await createAdhocMeal({
        meal_label: label,
        protein_g: p,
        carbs_g: c,
        fat_g: f,
      });
      setProtein("");
      setCarbs("");
      setFat("");
      await onChanged();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save — run migration 014_adhoc_meals.sql?"
      );
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await deleteAdhocMeal(id);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-2">
      {compact && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[11px] font-semibold text-primary hover:underline"
        >
          {open ? "Hide quick meal" : "+ Quick meal (P/C/F)"}
        </button>
      )}

      {open && (
        <form
          onSubmit={onSave}
          className="rounded-lg border border-border/70 bg-card/80 p-2.5 space-y-2"
        >
          <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
            Quick meal
          </p>
          <div className="flex flex-wrap gap-1">
            {MEAL_LABELS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setLabel(m)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors",
                  label === m
                    ? "border-primary/40 bg-primary/20 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <div className="space-y-0.5">
              <Label htmlFor="adhoc-p" className="text-[10px]">
                Protein g
              </Label>
              <Input
                id="adhoc-p"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="h-8 text-sm"
                placeholder="0"
              />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="adhoc-c" className="text-[10px]">
                Carbs g
              </Label>
              <Input
                id="adhoc-c"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="h-8 text-sm"
                placeholder="0"
              />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="adhoc-f" className="text-[10px]">
                Fat g
              </Label>
              <Input
                id="adhoc-f"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="h-8 text-sm"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-2">
            <div>
              <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                Calories (auto)
              </p>
              <p className="text-lg font-bold tabular-nums leading-tight">
                {kcal}{" "}
                <span className="text-xs font-semibold text-muted-foreground">
                  kcal
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground">4×P + 4×C + 9×F</p>
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-8 rounded-full"
              disabled={saving || !canSave}
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                "Add"
              )}
            </Button>
          </div>
        </form>
      )}

      {meals.length > 0 && (
        <ul className="flex flex-col gap-1">
          {meals.map((m) => (
            <li
              key={m.id}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-2 py-1.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">{m.meal_label}</p>
                <p className="text-[10px] tabular-nums text-muted-foreground">
                  {Math.round(m.calories)} kcal · {Math.round(m.protein_g)}P ·{" "}
                  {Math.round(m.carbs_g)}C · {Math.round(m.fat_g)}F
                </p>
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                disabled={busyId === m.id}
                onClick={() => void onDelete(m.id)}
                aria-label="Remove meal"
              >
                {busyId === m.id ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Trash2 className="size-3" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="text-[11px] text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
