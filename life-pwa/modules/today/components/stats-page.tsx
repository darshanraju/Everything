"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { loadSlaReport, type SlaReport } from "@/modules/today/sla";
import { SlaCards } from "@/modules/today/components/sla-cards";
import { SlaChart } from "@/modules/today/components/sla-chart";

const WINDOWS = [7, 30, 90] as const;

export function TodayStatsPage() {
  const [daysBack, setDaysBack] = useState<number>(30);
  const [report, setReport] = useState<SlaReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    void loadSlaReport(daysBack)
      .then(setReport)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [daysBack]);

  return (
    <AppShell
      title="SLA / Consistency"
      subtitle="Daily completion rates"
      actions={
        <Link
          href="/today"
          className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-full")}
        >
          Today
        </Link>
      }
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {WINDOWS.map((d) => (
          <Button
            key={d}
            size="sm"
            variant={daysBack === d ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setDaysBack(d)}
          >
            {d}d
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : report ? (
        <div className="flex flex-col gap-6">
          <SlaCards overall={report.overall} sources={report.sources} />

          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Overall daily completion</CardTitle>
              <CardDescription>
                % of expected tasks done each day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SlaChart scores={report.overall.scores} />
            </CardContent>
          </Card>

          {report.sources.map((src) => (
            <Card key={src.sourceKey} className="border-border/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{src.label} daily completion</CardTitle>
                <CardDescription>
                  {src.totalExpected > 0
                    ? `${src.totalCompleted}/${src.totalExpected} over ${daysBack}d`
                    : "No expected items"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SlaChart scores={src.scores} height={200} />
              </CardContent>
            </Card>
          ))}

          <p className="text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground/80">Fitness:</strong> training
            days only (rest ignored).{" "}
            <strong className="text-foreground/80">Health:</strong> active
            protocols logged that day.{" "}
            <strong className="text-foreground/80">Food:</strong> on-plan foods
            checked off that day.{" "}
            <strong className="text-foreground/80">Yours:</strong> manual
            tasks due that day. Future tabs auto-appear when they implement{" "}
            <code className="text-primary">getDayScores</code>.
          </p>
        </div>
      ) : null}
    </AppShell>
  );
}
