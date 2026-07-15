"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/schema";

export type NoteFormValues = {
  title: string;
  body: string;
};

type Props = {
  initial?: Note | null;
  submitLabel?: string;
  onSubmit: (values: NoteFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function NoteForm({
  initial,
  submitLabel = "Save",
  onSubmit,
  onDelete,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ title: title.trim(), body: body.trim() });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save — run migration 013_notes.sql?"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!confirm("Delete this note?")) return;
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
        <Label htmlFor="note-title">Title</Label>
        <Input
          id="note-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Rest timer per exercise"
          className="h-11"
          required
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note-body">
          Notes{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="note-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Details, UX ideas, why it matters…"
          rows={10}
          className="min-h-[200px] text-base"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          className="h-11 flex-1 rounded-full sm:flex-none sm:min-w-[140px]"
          disabled={saving || deleting || !title.trim()}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : submitLabel}
        </Button>
        <Link
          href="/notes"
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
