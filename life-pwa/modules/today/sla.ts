import { format } from "date-fns";
import { TODAY_CONTRIBUTORS } from "@/modules/today/contributors";
import { emptyScores, windowFromDaysBack } from "@/modules/today/dates";
import type { DayScore, TodaySourceKey } from "@/modules/today/types";

export type SourceSla = {
  sourceKey: TodaySourceKey;
  label: string;
  scores: DayScore[];
  /** completed/expected over days with expected > 0 */
  rate: number | null;
  totalExpected: number;
  totalCompleted: number;
};

export type SlaReport = {
  daysBack: number;
  from: string;
  to: string;
  sources: SourceSla[];
  overall: SourceSla;
};

export function dayRate(s: DayScore): number | null {
  if (s.expected <= 0) return null;
  return Math.min(1, s.completed / s.expected);
}

export function windowRate(scores: DayScore[]): {
  rate: number | null;
  totalExpected: number;
  totalCompleted: number;
} {
  let totalExpected = 0;
  let totalCompleted = 0;
  for (const s of scores) {
    if (s.expected <= 0) continue;
    totalExpected += s.expected;
    totalCompleted += Math.min(s.completed, s.expected);
  }
  return {
    totalExpected,
    totalCompleted,
    rate: totalExpected > 0 ? totalCompleted / totalExpected : null,
  };
}

function mergeOverall(seriesList: DayScore[][]): DayScore[] {
  if (seriesList.length === 0) return [];
  const dates = seriesList[0].map((s) => s.date);
  return dates.map((date, i) => {
    let expected = 0;
    let completed = 0;
    for (const series of seriesList) {
      const s = series[i];
      if (!s) continue;
      expected += s.expected;
      completed += s.completed;
    }
    return { date, expected, completed };
  });
}

function toSourceSla(
  sourceKey: string,
  label: string,
  scores: DayScore[]
): SourceSla {
  const w = windowRate(scores);
  return {
    sourceKey,
    label,
    scores,
    rate: w.rate,
    totalExpected: w.totalExpected,
    totalCompleted: w.totalCompleted,
  };
}

export async function loadSlaReport(daysBack = 30): Promise<SlaReport> {
  const { from, to } = windowFromDaysBack(daysBack);
  const enabled = TODAY_CONTRIBUTORS.filter(
    (c) => c.enabled && typeof c.getDayScores === "function"
  );

  const sources: SourceSla[] = await Promise.all(
    enabled.map(async (c) => {
      try {
        const scores = await c.getDayScores!(from, to);
        return toSourceSla(c.sourceKey, c.label, scores);
      } catch (e) {
        console.error(`SLA ${c.sourceKey} failed`, e);
        return toSourceSla(c.sourceKey, c.label, emptyScores(from, to));
      }
    })
  );

  const overallScores = mergeOverall(sources.map((s) => s.scores));
  const overall = toSourceSla("overall", "Overall", overallScores);

  return {
    daysBack,
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
    sources,
    overall,
  };
}

export function formatSlaPercent(rate: number | null): string {
  if (rate === null) return "—";
  return `${Math.round(rate * 100)}%`;
}

export function slaTone(
  rate: number | null
): "good" | "ok" | "bad" | "na" {
  if (rate === null) return "na";
  if (rate >= 0.95) return "good";
  if (rate >= 0.8) return "ok";
  return "bad";
}
