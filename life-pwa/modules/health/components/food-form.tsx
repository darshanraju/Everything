"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { caloriesFromMacros, type Food } from "@/lib/schema";

export type FoodFormValues = {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  notes: string;
  on_plan: boolean;
};

type Props = {
  initial?: Food | null;
  submitLabel?: string;
  onSubmit: (values: FoodFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
};

function parseNonNeg(raw: string, label: string): number {
  const n = Number(raw);
  if (Number.isNaN(n) || n < 0) {
    throw new Error(`${label} must be a number ≥ 0`);
  }
  return n;
}

export function FoodForm({
  initial,
  submitLabel = "Save food",
  onSubmit,
  onDelete,
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [protein, setProtein] = useState(
    initial != null ? String(initial.protein_g) : ""
  );
  const [carbs, setCarbs] = useState(
    initial != null ? String(initial.carbs_g) : ""
  );
  const [fat, setFat] = useState(initial != null ? String(initial.fat_g) : "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [onPlan, setOnPlan] = useState(initial?.on_plan ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const p = Number(protein) || 0;
  const c = Number(carbs) || 0;
  const f = Number(fat) || 0;
  const kcal = useMemo(
    () => caloriesFromMacros(p, c, f),
    [p, c, f]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const protein_g = parseNonNeg(protein || "0", "Protein");
      const carbs_g = parseNonNeg(carbs || "0", "Carbs");
      const fat_g = parseNonNeg(fat || "0", "Fat");
      await onSubmit({
        name: name.trim(),
        calories: caloriesFromMacros(protein_g, carbs_g, fat_g),
        protein_g,
        carbs_g,
        fat_g,
        notes: notes.trim(),
        on_plan: onPlan,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save — run migration 010_food_macros.sql?"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Delete this food?")) return;
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="food-name">Name</Label>
        <Input
          id="food-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Chicken bowl"
          className="h-11"
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="food-p">Protein (g)</Label>
          <Input
            id="food-p"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className="h-11"
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="food-c">Carbs (g)</Label>
          <Input
            id="food-c"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            className="h-11"
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="food-f">Fat (g)</Label>
          <Input
            id="food-f"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            className="h-11"
            placeholder="0"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Calories (auto)
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">
          {kcal}{" "}
          <span className="text-base font-semibold text-muted-foreground">
            kcal
          </span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          From macros · 4×P + 4×C + 9×F
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="food-notes">
          Notes{" "}
          <span className="font-normal text-muted-foreground">
            (optional · serving size)
          </span>
        </Label>
        <Textarea
          id="food-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="1 bowl, post-workout…"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={onPlan}
          onChange={(e) => setOnPlan(e.target.checked)}
          className="size-4 rounded border-border"
        />
        <span>
          On daily plan{" "}
          <span className="text-muted-foreground">
            (shows on Food Today + Today tab)
          </span>
        </span>
      </label>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="submit"
          className="h-11 flex-1 rounded-full sm:flex-none sm:min-w-[140px]"
          disabled={saving || deleting || !name.trim()}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : submitLabel}
        </Button>
        <Link
          href="/health/food/library"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-11 rounded-full px-4"
          )}
        >
          Cancel
        </Link>
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-full text-destructive hover:text-destructive"
            disabled={saving || deleting}
            onClick={() => void handleDelete()}
          >
            {deleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="size-4" />
                Delete
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
