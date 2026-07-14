"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  HEALTH_CATEGORIES,
  PEPTIDE_FREQUENCIES,
  WEEKDAYS,
  type HealthCategory,
  type HealthProtocol,
} from "@/lib/schema";
import { normalizeScheduleForSave } from "@/modules/health/lib/schedule";

export type ProtocolFormValues = {
  name: string;
  category: HealthCategory;
  amount: number | null;
  unit: string;
  syringe_units: number | null;
  frequency: string;
  frequency_note: string;
  schedule_weekdays: number[] | null;
  notes: string;
  active: boolean;
};

type Props = {
  initial?: HealthProtocol | null;
  submitLabel?: string;
  onSubmit: (values: ProtocolFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function ProtocolForm({
  initial,
  submitLabel = "Save protocol",
  onSubmit,
  onDelete,
}: Props) {
  const [category, setCategory] = useState<HealthCategory>(
    initial?.category ?? "medicine"
  );
  const [name, setName] = useState(initial?.name ?? "");
  const [amount, setAmount] = useState(
    initial?.amount != null ? String(initial.amount) : ""
  );
  const [unit, setUnit] = useState(initial?.unit ?? "mg");
  const [syringeUnits, setSyringeUnits] = useState(
    initial?.syringe_units != null ? String(initial.syringe_units) : ""
  );
  const [frequency, setFrequency] = useState(initial?.frequency ?? "daily");
  const [frequencyNote, setFrequencyNote] = useState(
    initial?.frequency_note ?? ""
  );
  const initialDays = initial?.schedule_weekdays ?? [];
  const [weeklyDay, setWeeklyDay] = useState<number>(
    initialDays[0] != null ? initialDays[0] : 0
  );
  const [customDays, setCustomDays] = useState<number[]>(
    initial?.frequency === "custom" ? initialDays : []
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onCategoryChange(c: HealthCategory) {
    setCategory(c);
    if (!initial) {
      if (c === "peptide") setUnit("mcg");
      else if (c === "medicine" || c === "supplement") setUnit("mg");
      else if (c === "skincare") setUnit("application");
      else setUnit("unit");
    }
  }

  function onFrequencyChange(f: string) {
    setFrequency(f);
    if (f === "weekly" && weeklyDay == null) setWeeklyDay(0);
    if (f === "custom" && customDays.length === 0) {
      // leave empty so user picks
    }
  }

  function toggleCustomDay(day: number) {
    setCustomDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day).sort((a, b) => a - b);
      return [...prev, day].sort((a, b) => a - b);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const amt = amount.trim() === "" ? null : Number(amount);
    if (amt != null && (Number.isNaN(amt) || amt < 0)) {
      setError("Amount must be a valid number, or leave blank.");
      return;
    }
    const draw = syringeUnits.trim() === "" ? null : Number(syringeUnits);
    if (
      category === "peptide" &&
      draw != null &&
      (Number.isNaN(draw) || draw <= 0 || draw > 100)
    ) {
      setError(
        "Syringe units must be between 1 and 100 on a 1 ml (U-100) syringe."
      );
      return;
    }
    if (frequency === "custom" && customDays.length === 0) {
      setError("Pick at least one day for a custom schedule.");
      return;
    }

    const rawDays =
      frequency === "weekly"
        ? [weeklyDay]
        : frequency === "custom"
          ? customDays
          : null;
    const schedule_weekdays = normalizeScheduleForSave(frequency, rawDays);

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name,
        category,
        amount: amt,
        unit,
        syringe_units: category === "peptide" ? draw : null,
        frequency,
        frequency_note: frequencyNote,
        schedule_weekdays,
        notes,
        active,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (
      !confirm(
        "Delete this protocol permanently? Past logs for it may also be removed."
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as HealthCategory)}
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
        >
          {HEALTH_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            category === "skincare"
              ? "e.g. Ketoconazole shampoo"
              : category === "medicine"
                ? "e.g. Metformin"
                : category === "peptide"
                  ? "e.g. BPC-157"
                  : "e.g. Vitamin D"
          }
          className="h-11"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-2">
          <Label htmlFor="amount">Amount (optional)</Label>
          <Input
            id="amount"
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={category === "skincare" ? "1" : "250"}
            className="h-11"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="unit">Unit</Label>
          <select
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="mcg">mcg</option>
            <option value="mg">mg</option>
            <option value="g">g</option>
            <option value="IU">IU</option>
            <option value="ml">ml</option>
            <option value="tablet">tablet(s)</option>
            <option value="capsule">capsule(s)</option>
            <option value="drop">drop(s)</option>
            <option value="application">application</option>
            <option value="pump">pump(s)</option>
            <option value="unit">unit(s)</option>
          </select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Leave amount blank for “as directed” (e.g. shampoo use).
      </p>

      {category === "peptide" && (
        <div className="grid gap-2 rounded-xl border border-border/80 bg-muted/40 p-3">
          <Label htmlFor="syringe-units">Units to pull (1 ml syringe)</Label>
          <Input
            id="syringe-units"
            type="number"
            min={1}
            max={100}
            step={1}
            value={syringeUnits}
            onChange={(e) => setSyringeUnits(e.target.value)}
            placeholder="e.g. 10"
            className="h-11"
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            On a standard insulin syringe,{" "}
            <strong className="text-foreground/90">1 ml = 100 units</strong>.
            Optional.
          </p>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="freq">Frequency</Label>
        <select
          id="freq"
          value={frequency}
          onChange={(e) => onFrequencyChange(e.target.value)}
          className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
        >
          {PEPTIDE_FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {frequency === "weekly" && (
        <div className="grid gap-2">
          <Label htmlFor="weekly-day">Day of week</Label>
          <select
            id="weekly-day"
            value={weeklyDay}
            onChange={(e) => setWeeklyDay(Number(e.target.value))}
            className="h-11 rounded-lg border border-input bg-background px-3 text-sm"
          >
            {WEEKDAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Only shows on Today on this day.
          </p>
        </div>
      )}

      {frequency === "custom" && (
        <div className="grid gap-2">
          <Label>Days of week</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => {
              const on = customDays.includes(d.value);
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleCustomDay(d.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    on
                      ? "border-primary/40 bg-primary/20 text-primary"
                      : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {d.short}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Multi-select. Today only lists this protocol on selected days.
          </p>
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Timing, with food, scalp only…"
          rows={3}
        />
      </div>

      {initial && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="size-4 rounded border-input"
          />
          Active (uncheck to archive)
        </label>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        size="lg"
        className="rounded-full"
        disabled={saving || deleting || !name.trim()}
      >
        {saving ? <Loader2 className="animate-spin" /> : submitLabel}
      </Button>
      <Link
        href="/health"
        className={cn(buttonVariants({ variant: "ghost" }), "rounded-full")}
      >
        Cancel
      </Link>
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          className="rounded-full text-destructive"
          disabled={saving || deleting}
          onClick={() => void handleDelete()}
        >
          {deleting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Trash2 className="size-4" />
              Delete protocol
            </>
          )}
        </Button>
      )}
    </form>
  );
}
