"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Check, ChevronRight, Loader2, Plus } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import {
  DesktopBoard,
  DesktopCard,
} from "@/components/shell/desktop-board";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  countPending,
  loadTodaySections,
} from "@/modules/today/aggregate";
import type { TodayItem, TodaySection } from "@/modules/today/types";
import { createTodayTask } from "@/modules/manual/lib/api";
import {
  formatSlaPercent,
  loadSlaReport,
  slaTone,
} from "@/modules/today/sla";
import { FoodSearchAdd } from "@/modules/health/components/food-search-add";
import { MacroProgress } from "@/modules/health/components/macro-progress";
import {
  getMacroTotalsForDate,
  listAdhocMealsForDate,
  logFoodForDate,
} from "@/modules/health/lib/food";
import type { AdhocMeal, MacroTargets, MacroTotals } from "@/lib/schema";
import { emptyMacroTotals } from "@/lib/schema";
import { AdhocMealForm } from "@/modules/health/components/adhoc-meal-form";

export function TodayPage() {
  const [sections, setSections] = useState<TodaySection[]>([]);
  const [sla30, setSla30] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [macroTargets, setMacroTargets] = useState<MacroTargets | null>(null);
  const [macroCurrent, setMacroCurrent] =
    useState<MacroTotals>(emptyMacroTotals());
  const [adhocMeals, setAdhocMeals] = useState<AdhocMeal[]>([]);

  const refresh = useCallback(async () => {
    const [s, report, macros, adhoc] = await Promise.all([
      loadTodaySections(new Date()),
      loadSlaReport(30).catch(() => null),
      getMacroTotalsForDate(new Date()).catch(() => null),
      listAdhocMealsForDate(new Date()).catch(() => [] as AdhocMeal[]),
    ]);
    setSections(s);
    setSla30(report ? formatSlaPercent(report.overall.rate) : null);
    if (macros) {
      setMacroTargets(macros.targets);
      setMacroCurrent(macros.current);
    }
    setAdhocMeals(adhoc);
  }, []);

  useEffect(() => {
    void refresh()
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [refresh]);

  const pending = countPending(sections);
  const todayLabel = format(new Date(), "EEEE · d MMM yyyy");
  const foodOnPlanIds = useMemo(() => {
    const food = sections.find((s) => s.sourceKey === "food");
    if (!food) return new Set<string>();
    return new Set(
      food.items
        .map((i) => i.meta?.foodId as string | undefined)
        .filter((id): id is string => Boolean(id))
    );
  }, [sections]);

  const slaToneClass =
    sla30 === null
      ? "text-muted-foreground"
      : slaTone(
            sla30 === "—"
              ? null
              : Number(sla30.replace("%", "")) / 100
          ) === "good"
        ? "text-emerald-400"
        : slaTone(Number(sla30.replace("%", "")) / 100) === "ok"
          ? "text-amber-400"
          : "text-red-400";

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await createTodayTask(newTitle.trim());
      setNewTitle("");
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not add task — run migration 007_today_tasks.sql?"
      );
    } finally {
      setAdding(false);
    }
  }

  async function onToggle(section: TodaySection, item: TodayItem) {
    if (item.completeAction !== "toggle" || !section.completeItem) return;
    setBusyId(item.id);
    setError(null);
    try {
      await section.completeItem(item);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell
      layout="desktop"
      title="Today"
      subtitle={`${todayLabel}${pending ? ` · ${pending} left` : " · All clear"}`}
      actions={
        <Link
          href="/today/stats"
          className={cn(
            buttonVariants({ size: "sm", variant: "outline" }),
            "rounded-full tabular-nums",
            slaToneClass
          )}
        >
          {sla30 != null ? `30d ${sla30}` : "SLA"}
        </Link>
      }
    >
      <form onSubmit={onAdd} className="mb-4 flex gap-2 lg:max-w-md">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add something for today…"
          className="h-11 flex-1"
          disabled={adding}
        />
        <Button
          type="submit"
          className="h-11 shrink-0 rounded-full"
          disabled={adding || !newTitle.trim()}
        >
          {adding ? <Loader2 className="animate-spin" /> : <Plus />}
          Add
        </Button>
      </form>

      {error && (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </p>
      ) : (
        <DesktopBoard>
          {sections.map((section) => (
            <DesktopCard key={section.sourceKey} title={section.label}>
              {section.sourceKey === "food" && (
                <div className="mb-2 space-y-2">
                  {macroTargets && (
                    <MacroProgress
                      compact
                      targets={macroTargets}
                      current={macroCurrent}
                    />
                  )}
                  <FoodSearchAdd
                    onPlanIds={foodOnPlanIds}
                    onAdded={async (food, meta) => {
                      if (meta.alreadyOnPlan) {
                        await logFoodForDate(food.id, new Date());
                      }
                      await refresh();
                    }}
                    placeholder="Search foods…"
                  />
                  <AdhocMealForm
                    compact
                    meals={adhocMeals}
                    onChanged={refresh}
                  />
                </div>
              )}

              {section.items.length === 0 &&
              !(section.sourceKey === "food" && adhocMeals.length > 0) ? (
                <p className="text-xs text-muted-foreground">
                  {section.sourceKey === "food"
                    ? "No plan foods — search or quick meal above."
                    : section.sourceKey === "manual"
                      ? "No todos yet — add above."
                      : "Nothing here."}
                </p>
              ) : section.items.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {section.items.map((item) => (
                    <TodayItemRow
                      key={item.id}
                      item={item}
                      busy={busyId === item.id}
                      onToggle={() => void onToggle(section, item)}
                    />
                  ))}
                </ul>
              ) : null}
            </DesktopCard>
          ))}
        </DesktopBoard>
      )}
    </AppShell>
  );
}

function TodayItemRow({
  item,
  busy,
  onToggle,
}: {
  item: TodayItem;
  busy: boolean;
  onToggle: () => void;
}) {
  const done = item.status === "done";
  const canToggle = item.completeAction === "toggle";

  const row = (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-border/70 bg-card px-2.5 py-2",
        done && "opacity-70"
      )}
    >
      {canToggle ? (
        <button
          type="button"
          disabled={busy}
          onClick={onToggle}
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            done
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 hover:border-primary"
          )}
          aria-label={done ? "Mark incomplete" : "Complete"}
        >
          {busy ? (
            <Loader2 className="size-3 animate-spin" />
          ) : done ? (
            <Check className="size-3" />
          ) : null}
        </button>
      ) : (
        <span
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2",
            done
              ? "border-primary bg-primary/30 text-primary"
              : "border-muted-foreground/30"
          )}
        >
          {done ? <Check className="size-3" /> : null}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold leading-snug",
            done && "text-muted-foreground line-through"
          )}
        >
          {item.title}
        </p>
        {item.subtitle && (
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
            {item.subtitle}
          </p>
        )}
      </div>
      {item.href && (
        <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      )}
    </div>
  );

  if (item.href && !canToggle) {
    return (
      <li>
        <Link href={item.href} className="block">
          {row}
        </Link>
      </li>
    );
  }
  if (item.href && canToggle) {
    return (
      <li className="relative">
        {row}
        <Link
          href={item.href}
          className="absolute inset-y-0 right-0 w-8"
          aria-label="Open details"
        />
      </li>
    );
  }
  return <li>{row}</li>;
}
