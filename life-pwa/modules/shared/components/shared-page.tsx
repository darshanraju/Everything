"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SharedLink } from "@/lib/schema";
import {
  SHARED_LINK_TAGS,
  hostnameOf,
  sharedTagLabel,
  tagBadgeClass,
} from "@/modules/shared/tags";
import {
  deleteSharedLink,
  listSharedLinks,
} from "@/modules/shared/lib/api";
import {
  SaveLinkModal,
  type SaveLinkDraft,
} from "@/modules/shared/components/save-link-modal";

const emptyDraft = (): SaveLinkDraft => ({
  url: "",
  title: "",
  tag: "other",
});

export function SharedPage({
  initialDraft,
  clearInitialDraft,
}: {
  /** Prefill from share target / query string */
  initialDraft?: SaveLinkDraft | null;
  clearInitialDraft?: () => void;
}) {
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<SaveLinkDraft>(emptyDraft());
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const list = await listSharedLinks();
    setLinks(list);
  }, []);

  useEffect(() => {
    void refresh()
      .catch((e) =>
        setError(
          e instanceof Error
            ? e.message
            : "Load failed — run migration 008_shared_links.sql?"
        )
      )
      .finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (!initialDraft) return;
    setDraft(initialDraft);
    setModalOpen(true);
  }, [initialDraft]);

  const filtered = useMemo(() => {
    if (filter === "all") return links;
    return links.filter((l) => l.tag === filter);
  }, [links, filter]);

  function openAdd() {
    setDraft(emptyDraft());
    setModalOpen(true);
  }

  function openEdit(link: SharedLink) {
    setDraft({
      id: link.id,
      url: link.url,
      title: link.title,
      tag: link.tag,
      share_text: link.share_text,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setDraft(emptyDraft());
    clearInitialDraft?.();
  }

  async function onSaved(link: SharedLink) {
    setLinks((prev) => {
      const without = prev.filter((l) => l.id !== link.id);
      return [link, ...without].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    closeModal();
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this link?")) return;
    setBusyId(id);
    setError(null);
    try {
      await deleteSharedLink(id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell
      title="Shared"
      subtitle="Links you save for later"
      actions={
        <Button
          size="sm"
          className="rounded-full"
          onClick={openAdd}
        >
          <Plus className="size-4" />
          Add
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label="All"
        />
        {SHARED_LINK_TAGS.map((t) => (
          <FilterChip
            key={t.value}
            active={filter === t.value}
            onClick={() => setFilter(t.value)}
            label={t.label}
            className={filter === t.value ? tagBadgeClass(t.value) : undefined}
          />
        ))}
      </div>

      {error && (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm font-medium text-foreground">
            {filter === "all" ? "No links yet" : `No ${sharedTagLabel(filter)} links`}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Tap <strong className="text-foreground/80">Add</strong> to paste a URL,
            or share a page from another app → <strong className="text-foreground/80">Life</strong>{" "}
            (installed PWA; best on Android).
          </p>
          {filter === "all" && (
            <Button
              className="mt-4 rounded-full"
              size="sm"
              onClick={openAdd}
            >
              <Plus className="size-4" />
              Add link
            </Button>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((link) => (
            <li
              key={link.id}
              className="rounded-xl border border-border/80 bg-card p-3"
            >
              <div className="flex items-start gap-2">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold leading-snug text-foreground">
                      {link.title}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 border text-[10px] font-semibold uppercase tracking-wide",
                        tagBadgeClass(link.tag)
                      )}
                    >
                      {sharedTagLabel(link.tag)}
                    </Badge>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <ExternalLink className="size-3 shrink-0 opacity-70" />
                    <span className="truncate">{hostnameOf(link.url)}</span>
                    <span className="shrink-0">·</span>
                    <span className="shrink-0">
                      {format(parseISO(link.created_at), "d MMM yyyy")}
                    </span>
                  </p>
                </a>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-full"
                    disabled={busyId === link.id}
                    onClick={() => openEdit(link)}
                    aria-label="Edit"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="rounded-full text-muted-foreground hover:text-destructive"
                    disabled={busyId === link.id}
                    onClick={() => void onDelete(link.id)}
                    aria-label="Delete"
                  >
                    {busyId === link.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <SaveLinkModal
        open={modalOpen}
        initial={draft}
        onClose={closeModal}
        onSaved={onSaved}
      />
    </AppShell>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  className,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? className ?? "border-primary/40 bg-primary/15 text-primary"
          : "border-border bg-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
