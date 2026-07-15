"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Loader2, Plus } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/schema";
import { listNotes } from "@/modules/notes/lib/api";

function preview(body: string | null, max = 120): string {
  if (!body?.trim()) return "No details";
  const t = body.trim().replace(/\s+/g, " ");
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setNotes(await listNotes());
  }, []);

  useEffect(() => {
    void refresh()
      .catch((e) =>
        setError(
          e instanceof Error
            ? e.message
            : "Load failed — run migration 013_notes.sql?"
        )
      )
      .finally(() => setLoading(false));
  }, [refresh]);

  return (
    <AppShell
      layout="desktop"
      title="Notes"
      subtitle="Feature ideas & scratchpad"
      actions={
        <Link
          href="/notes/new"
          className={cn(buttonVariants({ size: "sm" }), "rounded-full gap-1")}
        >
          <Plus className="size-4" /> New
        </Link>
      }
    >
      {error && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </p>
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center">
          <p className="font-medium">No notes yet</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Capture feature ideas you want in Life — rest timers, charts,
            integrations, whatever.
          </p>
          <Link
            href="/notes/new"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-4 rounded-full gap-1"
            )}
          >
            <Plus className="size-4" />
            New note
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-3">
          {notes.map((n) => (
            <li key={n.id}>
              <Link
                href={`/notes/${n.id}`}
                className="block h-full rounded-xl border border-border/80 bg-card p-4 transition-colors hover:bg-muted/30"
              >
                <p className="font-bold leading-snug">{n.title}</p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {preview(n.body)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground/80">
                  Updated {format(parseISO(n.updated_at), "d MMM yyyy · HH:mm")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
