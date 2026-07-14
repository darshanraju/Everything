"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SharedLink } from "@/lib/schema";
import {
  SHARED_LINK_TAGS,
  tagBadgeClass,
} from "@/modules/shared/tags";
import {
  createSharedLink,
  updateSharedLink,
} from "@/modules/shared/lib/api";

export type SaveLinkDraft = {
  id?: string;
  url: string;
  title: string;
  tag: string;
  share_text?: string | null;
};

type Props = {
  open: boolean;
  initial: SaveLinkDraft;
  onClose: () => void;
  onSaved: (link: SharedLink) => void;
};

export function SaveLinkModal({ open, initial, onClose, onSaved }: Props) {
  const [url, setUrl] = useState(initial.url);
  const [title, setTitle] = useState(initial.title);
  const [tag, setTag] = useState(initial.tag || "other");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setUrl(initial.url);
    setTitle(initial.title);
    setTag(initial.tag || "other");
    setError(null);
    setSaving(false);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  const editing = Boolean(initial.id);
  const canSave =
    url.trim().length > 0 && title.trim().length > 0 && !saving;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const link = editing
        ? await updateSharedLink(initial.id!, {
            url: url.trim(),
            title: title.trim(),
            tag,
          })
        : await createSharedLink({
            url: url.trim(),
            title: title.trim(),
            tag,
            share_text: initial.share_text,
          });
      onSaved(link);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save — run migration 008_shared_links.sql?"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-link-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close"
        disabled={saving}
        onClick={() => !saving && onClose()}
      />
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl border border-border/80 bg-card p-5 shadow-xl sm:rounded-2xl sm:m-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="save-link-title" className="text-lg font-bold tracking-tight">
              {editing ? "Edit link" : "Save link"}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Title and tag for your Shared inbox
            </p>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="shrink-0 rounded-full"
            disabled={saving}
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="shared-url">URL</Label>
            <Input
              id="shared-url"
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="https://…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-11"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shared-title">Title</Label>
            <Input
              id="shared-title"
              placeholder="What is this?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11"
              required
              autoFocus={!initial.title}
            />
          </div>

          <div className="space-y-2">
            <Label>Tag</Label>
            <div className="flex flex-wrap gap-2">
              {SHARED_LINK_TAGS.map((t) => {
                const active = tag === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTag(t.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? tagBadgeClass(t.value)
                        : "border-border bg-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-full"
              disabled={saving}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-11 flex-1 rounded-full"
              disabled={!canSave}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : editing ? (
                "Update"
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
