"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  formatSlaPercent,
  slaTone,
  type SourceSla,
} from "@/modules/today/sla";

function toneClass(tone: ReturnType<typeof slaTone>): string {
  switch (tone) {
    case "good":
      return "text-emerald-400";
    case "ok":
      return "text-amber-400";
    case "bad":
      return "text-red-400";
    default:
      return "text-muted-foreground";
  }
}

export function SlaCards({
  overall,
  sources,
}: {
  overall: SourceSla;
  sources: SourceSla[];
}) {
  const cards = [overall, ...sources];
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((s) => {
        const tone = slaTone(s.rate);
        return (
          <Card
            key={s.sourceKey}
            className={cn(
              "border-border/80 bg-card",
              s.sourceKey === "overall" && "col-span-2 border-primary/30 bg-primary/5"
            )}
          >
            <CardHeader className="p-4 pb-1">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {s.label}
              </p>
              <CardTitle
                className={cn("text-3xl font-bold tabular-nums", toneClass(tone))}
              >
                {formatSlaPercent(s.rate)}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-xs text-muted-foreground">
              {s.totalExpected > 0
                ? `${s.totalCompleted}/${s.totalExpected} done`
                : "No expected items in range"}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
