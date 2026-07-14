"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { HealthNav } from "@/modules/health/components/health-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getMacroTargets,
  updateMacroTargets,
} from "@/modules/health/lib/food";

export default function FoodTargetsPage() {
  const router = useRouter();
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getMacroTargets()
      .then((t) => {
        setCalories(String(t.calories));
        setProtein(String(t.protein_g));
        setCarbs(String(t.carbs_g));
        setFat(String(t.fat_g));
      })
      .catch((e) =>
        setError(
          e instanceof Error
            ? e.message
            : "Load failed — run migration 010_food_macros.sql?"
        )
      )
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cals = Number(calories);
    const p = Number(protein);
    const c = Number(carbs);
    const f = Number(fat);
    if ([cals, p, c, f].some((n) => Number.isNaN(n) || n < 0)) {
      setError("All targets must be numbers ≥ 0");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateMacroTargets({
        calories: cals,
        protein_g: p,
        carbs_g: c,
        fat_g: f,
      });
      router.push("/health/food");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Macro targets" subtitle="Daily goals">
      <HealthNav showFoodSecondary />

      {loading ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-kcal">Calories (kcal)</Label>
              <Input
                id="t-kcal"
                type="number"
                min={0}
                step="any"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="h-11"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-p">Protein (g)</Label>
              <Input
                id="t-p"
                type="number"
                min={0}
                step="any"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="h-11"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-c">Carbs (g)</Label>
              <Input
                id="t-c"
                type="number"
                min={0}
                step="any"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                className="h-11"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-f">Fat (g)</Label>
              <Input
                id="t-f"
                type="number"
                min={0}
                step="any"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                className="h-11"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="h-11 rounded-full"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Save targets"
            )}
          </Button>
        </form>
      )}
    </AppShell>
  );
}
