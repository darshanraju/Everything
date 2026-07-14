"use client";

import { cn } from "@/lib/utils";
import type { MacroTargets, MacroTotals } from "@/lib/schema";

function barTone(current: number, target: number): string {
  if (target <= 0) return "bg-muted-foreground/40";
  const r = current / target;
  if (r >= 1.1) return "bg-amber-400";
  if (r >= 0.9) return "bg-emerald-400";
  if (r >= 0.5) return "bg-sky-400";
  return "bg-muted-foreground/50";
}

function MacroBar({
  label,
  unit,
  current,
  target,
}: {
  label: string;
  unit: string;
  current: number;
  target: number;
}) {
  const pct =
    target > 0 ? Math.min(150, Math.round((current / target) * 100)) : 0;
  const width = Math.min(100, pct);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {Math.round(current)}
          {unit} / {Math.round(target)}
          {unit}
          <span className="ml-1 opacity-70">({Math.min(pct, 999)}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", barTone(current, target))}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function MacroProgress({
  targets,
  current,
}: {
  targets: MacroTargets;
  current: MacroTotals;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Today vs targets
      </p>
      <MacroBar
        label="Calories"
        unit=""
        current={current.calories}
        target={targets.calories}
      />
      <MacroBar
        label="Protein"
        unit="g"
        current={current.protein_g}
        target={targets.protein_g}
      />
      <MacroBar
        label="Carbs"
        unit="g"
        current={current.carbs_g}
        target={targets.carbs_g}
      />
      <MacroBar
        label="Fat"
        unit="g"
        current={current.fat_g}
        target={targets.fat_g}
      />
    </div>
  );
}

export function MacroTargetsSummary({
  targets,
  planTotals,
}: {
  targets: MacroTargets;
  planTotals?: MacroTotals | null;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <p>
        <span className="font-semibold text-foreground/80">Targets:</span>{" "}
        {Math.round(targets.calories)} kcal · {Math.round(targets.protein_g)}P ·{" "}
        {Math.round(targets.carbs_g)}C · {Math.round(targets.fat_g)}F
      </p>
      {planTotals && (
        <p className="mt-1">
          <span className="font-semibold text-foreground/80">On-plan sum:</span>{" "}
          {Math.round(planTotals.calories)} kcal ·{" "}
          {Math.round(planTotals.protein_g)}P · {Math.round(planTotals.carbs_g)}
          C · {Math.round(planTotals.fat_g)}F
        </p>
      )}
    </div>
  );
}
