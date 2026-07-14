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
  SURGERY_STATUSES,
  type Surgery,
  type SurgeryStatus,
} from "@/lib/schema";

export type SurgeryFormValues = {
  title: string;
  location: string;
  notes: string;
  status: SurgeryStatus;
  cost: number | null;
};

type Props = {
  initial?: Surgery | null;
  submitLabel?: string;
  onSubmit: (values: SurgeryFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function SurgeryForm({
  initial,
  submitLabel = "Save",
  onSubmit,
  onDelete,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [status, setStatus] = useState<SurgeryStatus>(
    initial?.status ?? "new"
  );
  const [cost, setCost] = useState(
    initial?.cost != null ? String(initial.cost) : ""
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const costNum = cost.trim() === "" ? null : Number(cost);
    if (costNum != null && (Number.isNaN(costNum) || costNum < 0)) {
      setError("Cost must be a valid number, or leave blank.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        location: location.trim(),
        notes: notes.trim(),
        status,
        cost: costNum,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save — run migration 009_surgeries.sql?"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Delete this procedure?")) return;
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
        <Label htmlFor="surgery-title">Title</Label>
        <Input
          id="surgery-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Rhinoplasty"
          className="h-11"
          required
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="surgery-location">
          Location{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="surgery-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Clinic / city"
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="surgery-status">Status</Label>
        <select
          id="surgery-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as SurgeryStatus)}
          className="flex h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {SURGERY_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="surgery-cost">
          Cost{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="surgery-cost"
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="0"
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="surgery-notes">
          Notes{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="surgery-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Consult notes, recovery, links…"
          rows={4}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="submit"
          className="h-11 flex-1 rounded-full sm:flex-none sm:min-w-[140px]"
          disabled={saving || deleting || !title.trim()}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : submitLabel}
        </Button>
        <Link
          href="/health/surgery"
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
