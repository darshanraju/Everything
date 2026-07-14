"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { AppShell } from "@/components/shell/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  categoryLabel,
  type HealthCategory,
  type HealthLog,
} from "@/lib/schema";
import { HealthNav } from "@/modules/health/components/health-nav";
import { listRecentLogs } from "@/modules/health/lib/api";
import { cn } from "@/lib/utils";

function categoryBadgeClass(category: HealthCategory | undefined): string {
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

export default function HealthHistoryPage() {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listRecentLogs(50)
      .then(setLogs)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="History" subtitle="Recent protocol logs">
      <HealthNav showRoutineSecondary />

      {loading ? (
        <p className="text-muted-foreground">
          <Loader2 className="inline size-4 animate-spin" /> Loading…
        </p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground">No logs yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {logs.map((log) => {
            const amt = log.amount ?? log.protocol?.amount;
            const unit = log.protocol?.unit ?? "";
            const cat = log.protocol?.category;
            return (
              <li
                key={log.id}
                className="rounded-xl border border-border/80 bg-card px-4 py-3"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {cat && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-semibold",
                        categoryBadgeClass(cat)
                      )}
                    >
                      {categoryLabel(cat)}
                    </Badge>
                  )}
                </div>
                <p className="font-semibold">
                  {log.protocol?.name ?? "Protocol"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {amt != null
                    ? `${Number(amt)} ${unit}`
                    : "Logged use"}
                  {log.protocol?.category === "peptide" &&
                  log.protocol?.syringe_units != null
                    ? ` · ${Number(log.protocol.syringe_units)} units (1 ml syringe)`
                    : ""}{" "}
                  · {format(parseISO(log.taken_at), "d MMM yyyy · HH:mm")}
                </p>
                {log.notes && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {log.notes}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
