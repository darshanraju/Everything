"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Pencil, Plus } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { HealthNav } from "@/modules/health/components/health-nav";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  surgeryStatusLabel,
  type Surgery,
  type SurgeryStatus,
} from "@/lib/schema";
import { listSurgeries } from "@/modules/health/lib/surgeries";

function statusBadgeClass(status: SurgeryStatus | string): string {
  switch (status) {
    case "new":
      return "bg-muted text-muted-foreground border-border";
    case "consulting":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "price_found":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "booked":
      return "bg-violet-500/15 text-violet-300 border-violet-500/30";
    case "completed":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function formatCost(cost: number | null): string | null {
  if (cost == null) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(cost);
  } catch {
    return String(cost);
  }
}

export function SurgeryListPage() {
  const [items, setItems] = useState<Surgery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const list = await listSurgeries();
    setItems(list);
  }, []);

  useEffect(() => {
    void refresh()
      .catch((e) =>
        setError(
          e instanceof Error
            ? e.message
            : "Load failed — run migration 009_surgeries.sql?"
        )
      )
      .finally(() => setLoading(false));
  }, [refresh]);

  return (
    <AppShell
      title="Surgery"
      subtitle="Procedures & recovery"
      actions={
        <Link
          href="/health/surgery/new"
          className={cn(buttonVariants({ size: "sm" }), "rounded-full gap-1")}
        >
          <Plus className="size-4" /> New
        </Link>
      }
    >
      <HealthNav />

      {error && (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center">
          <p className="font-medium text-foreground">No procedures yet</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Track Rhinoplasty, Hair Transplant, Jaw Surgery, and other
            procedures.
          </p>
          <Link
            href="/health/surgery/new"
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-4 rounded-full gap-1"
            )}
          >
            <Plus className="size-4" />
            Add procedure
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((s) => {
            const costLabel = formatCost(s.cost);
            return (
              <li
                key={s.id}
                className="rounded-2xl border border-border/80 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-semibold",
                          statusBadgeClass(s.status)
                        )}
                      >
                        {surgeryStatusLabel(s.status)}
                      </Badge>
                    </div>
                    <p className="text-lg font-bold">{s.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {[s.location, costLabel].filter(Boolean).join(" · ") ||
                        "No location or cost"}
                    </p>
                    {s.notes && (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {s.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <Link
                    href={`/health/surgery/${s.id}`}
                    className={cn(
                      buttonVariants({ size: "sm", variant: "outline" }),
                      "rounded-full gap-1"
                    )}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
