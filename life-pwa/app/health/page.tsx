"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Check, Pencil } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  categoryLabel,
  type HealthCategory,
  type HealthProtocol,
} from "@/lib/schema";
import { HealthNav } from "@/modules/health/components/health-nav";
import {
  listProtocols,
  logDose,
  logsTodayForProtocol,
  setProtocolActive,
} from "@/modules/health/lib/api";
import {
  formatProtocolFrequency,
  isProtocolDueOn,
} from "@/modules/health/lib/schedule";

function categoryBadgeClass(category: HealthCategory): string {
  switch (category) {
    case "medicine":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "peptide":
      return "bg-violet-500/15 text-violet-300 border-violet-500/30";
    case "skincare":
      return "bg-pink-500/15 text-pink-300 border-pink-500/30";
    case "supplement":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function HealthHomePage() {
  const [protocols, setProtocols] = useState<HealthProtocol[]>([]);
  const [takenToday, setTakenToday] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const list = await listProtocols(true);
    setProtocols(list);
    const map: Record<string, boolean> = {};
    await Promise.all(
      list.map(async (p) => {
        const logs = await logsTodayForProtocol(p.id);
        map[p.id] = logs.length > 0;
      })
    );
    setTakenToday(map);
  }, []);

  useEffect(() => {
    void refresh()
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [refresh]);

  async function onLog(p: HealthProtocol) {
    setBusyId(p.id);
    setError(null);
    try {
      await logDose({ protocol_id: p.id });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not log");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell
      layout="desktop"
      title="Routine"
      subtitle="Meds, peptides, skincare & more"
      actions={
        <Link
          href="/health/protocols/new"
          className={cn(buttonVariants({ size: "sm" }), "rounded-full gap-1")}
        >
          <Plus className="size-4" /> New
        </Link>
      }
    >
      <HealthNav showRoutineSecondary />

      {loading ? (
        <p className="text-muted-foreground">
          <Loader2 className="inline size-4 animate-spin" /> Loading…
        </p>
      ) : protocols.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center">
          <p className="text-muted-foreground">
            No active protocols yet. Add medicine, peptides, shampoo, etc.
          </p>
          <Link
            href="/health/protocols/new"
            className={cn(buttonVariants({ size: "lg" }), "mt-4 rounded-full")}
          >
            Add protocol
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {protocols.map((p) => {
            const done = takenToday[p.id];
            const dueToday = isProtocolDueOn(p, new Date());
            return (
              <li
                key={p.id}
                className="rounded-2xl border border-border/80 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-semibold",
                          categoryBadgeClass(p.category)
                        )}
                      >
                        {categoryLabel(p.category)}
                      </Badge>
                      {dueToday && !done && (
                        <Badge variant="secondary" className="text-xs">
                          Due today
                        </Badge>
                      )}
                    </div>
                    <p className="text-lg font-bold">{p.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {p.amount != null
                        ? `${Number(p.amount)} ${p.unit}`
                        : "As directed"}
                      {" · "}
                      {formatProtocolFrequency(p)}
                    </p>
                    {p.category === "peptide" && p.syringe_units != null && (
                      <p className="mt-1 text-sm font-semibold text-primary">
                        Pull {Number(p.syringe_units)} units on 1 ml syringe
                        <span className="ml-1 font-normal text-muted-foreground">
                          ({(Number(p.syringe_units) / 100).toFixed(2)} ml)
                        </span>
                      </p>
                    )}
                    {p.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {p.notes}
                      </p>
                    )}
                  </div>
                  {done ? (
                    <Badge className="shrink-0 gap-1 bg-primary/20 text-primary">
                      <Check className="size-3" /> Today
                    </Badge>
                  ) : dueToday ? (
                    <Badge variant="secondary" className="shrink-0">
                      Due
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0 text-muted-foreground">
                      Not today
                    </Badge>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full"
                    disabled={busyId === p.id}
                    onClick={() => void onLog(p)}
                  >
                    {busyId === p.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      "Log"
                    )}
                  </Button>
                  <Link
                    href={`/health/protocols/${p.id}`}
                    className={cn(
                      buttonVariants({ size: "sm", variant: "outline" }),
                      "rounded-full gap-1"
                    )}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() =>
                      void setProtocolActive(p.id, false).then(refresh)
                    }
                  >
                    Archive
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </AppShell>
  );
}
