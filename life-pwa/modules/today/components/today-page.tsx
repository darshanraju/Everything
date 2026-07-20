"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { addDays, format, startOfDay } from "date-fns";
import {
  CalendarClock,
  Check,
  ChevronRight,
  Loader2,
  Plus,
} from "lucide-react";
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
import {
  createTodayTask,
  normalizeTaskLink,
  rescheduleTodayTask,
} from "@/modules/manual/lib/api";
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
import { AssistantBar } from "@/modules/today/components/assistant-bar";

export function TodayPage() {
  const [sections, setSections] = useState<TodaySection[]>([]);
  const [sla30, setSla30] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newLink, setNewLink] = useState("");
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
  /** Foods already logged today (for “Add again” in search) */
  const foodLoggedIds = useMemo(() => {
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
      await createTodayTask({
        title: newTitle.trim(),
        notes: normalizeTaskLink(newLink),
      });
      setNewTitle("");
      setNewLink("");
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

    const previousStatus = item.status;
    const previousAction = item.completeAction;
    const nextStatus = previousStatus === "done" ? "pending" : "done";
    // Food list only shows logged foods; "toggle" removes the log → drop row
    const removeFoodRow =
      section.sourceKey === "food" && previousStatus === "done";

    setError(null);
    // Optimistic UI — no spinner wait on the checkbox
    setSections((prev) =>
      prev.map((s) => {
        if (s.sourceKey !== section.sourceKey) return s;
        if (removeFoodRow) {
          return {
            ...s,
            items: s.items.filter((i) => i.id !== item.id),
          };
        }
        return {
          ...s,
          items: s.items.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: nextStatus,
                  completeAction:
                    s.sourceKey === "health" && nextStatus === "done"
                      ? "none"
                      : i.completeAction,
                }
              : i
          ),
        };
      })
    );

    try {
      // Pass original item so completeItem can derive nextDone from prior status
      await section.completeItem(item);
      // Reconcile macros / server truth without blocking the checkmark
      void refresh().catch(() => {
        /* keep optimistic UI */
      });
    } catch (err) {
      setSections((prev) =>
        prev.map((s) => {
          if (s.sourceKey !== section.sourceKey) return s;
          if (removeFoodRow) {
            // Put the food row back
            if (s.items.some((i) => i.id === item.id)) return s;
            return { ...s, items: [...s.items, item] };
          }
          return {
            ...s,
            items: s.items.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: previousStatus,
                    completeAction: previousAction,
                  }
                : i
            ),
          };
        })
      );
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function onReschedule(item: TodayItem, dueOn: Date) {
    const taskId = item.meta?.taskId as string | undefined;
    if (!taskId) return;
    setBusyId(item.id);
    setError(null);
    try {
      await rescheduleTodayTask(taskId, dueOn);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reschedule");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell
      layout="desktop"
      fillViewport
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
      <form
        onSubmit={onAdd}
        className="mb-3 flex shrink-0 flex-col gap-2 lg:max-w-lg"
      >
        <div className="flex gap-2">
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
        </div>
        <Input
          type="url"
          value={newLink}
          onChange={(e) => setNewLink(e.target.value)}
          placeholder="Optional link (https://…)"
          className="h-9 text-sm"
          disabled={adding}
          inputMode="url"
          autoComplete="url"
        />
      </form>

      <AssistantBar onApplied={refresh} />

      {error && (
        <p className="mb-3 shrink-0 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </p>
      ) : (
        <DesktopBoard className="lg:min-h-0 lg:flex-1 lg:auto-rows-[minmax(0,1fr)] lg:items-stretch xl:grid-cols-4">
          {sections.map((section) => (
            <DesktopCard
              key={section.sourceKey}
              title={section.label}
              scrollBody
            >
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
                    onPlanIds={foodLoggedIds}
                    onAdded={async (food) => {
                      // Always log as eaten today (list only shows logged foods)
                      await logFoodForDate(food.id, new Date());
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
                    ? "Nothing logged yet — search to add what you ate."
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
                      onReschedule={
                        section.sourceKey === "manual" &&
                        item.status === "pending" &&
                        Boolean(item.meta?.taskId)
                          ? (dueOn) => void onReschedule(item, dueOn)
                          : undefined
                      }
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

function DeferMenu({
  disabled,
  onPick,
}: {
  disabled?: boolean;
  onPick: (dueOn: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const tomorrow = startOfDay(addDays(new Date(), 1));
  const minDate = format(tomorrow, "yyyy-MM-dd");

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const presets: { label: string; date: Date }[] = [
    { label: "Tomorrow", date: tomorrow },
    { label: "In 3 days", date: startOfDay(addDays(new Date(), 3)) },
    { label: "Next week", date: startOfDay(addDays(new Date(), 7)) },
  ];

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="mt-0.5 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
        aria-label="Push to a later day"
        title="Push to a later day"
      >
        <CalendarClock className="size-3.5" />
      </button>
      {open && (
        <div
          className="absolute right-0 z-30 mt-1 w-44 rounded-lg border border-border bg-card p-1.5 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              className="flex w-full rounded-md px-2 py-1.5 text-left text-xs font-medium hover:bg-muted"
              onClick={() => {
                setOpen(false);
                onPick(p.date);
              }}
            >
              {p.label}
              <span className="ml-auto text-muted-foreground">
                {format(p.date, "d MMM")}
              </span>
            </button>
          ))}
          <div className="mt-1 border-t border-border/60 pt-1.5">
            <label className="px-2 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Pick date
            </label>
            <input
              ref={dateRef}
              type="date"
              min={minDate}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-xs"
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                const d = startOfDay(new Date(`${v}T12:00:00`));
                setOpen(false);
                onPick(d);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TodayItemRow({
  item,
  busy,
  onToggle,
  onReschedule,
}: {
  item: TodayItem;
  busy: boolean;
  onToggle: () => void;
  onReschedule?: (dueOn: Date) => void;
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
      {onReschedule && (
        <DeferMenu disabled={busy} onPick={onReschedule} />
      )}
      {item.href && (
        <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      )}
    </div>
  );

  const isExternal = Boolean(item.href?.startsWith("http"));

  if (item.href && !canToggle) {
    return (
      <li>
        {isExternal ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            {row}
          </a>
        ) : (
          <Link href={item.href} className="block">
            {row}
          </Link>
        )}
      </li>
    );
  }
  if (item.href && canToggle) {
    return (
      <li className="relative">
        {row}
        {isExternal ? (
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-y-0 right-0 w-8"
            aria-label="Open details"
          />
        ) : (
          <Link
            href={item.href}
            className="absolute inset-y-0 right-0 w-8"
            aria-label="Open details"
          />
        )}
      </li>
    );
  }
  return <li>{row}</li>;
}
