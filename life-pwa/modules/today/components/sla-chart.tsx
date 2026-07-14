"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { DayScore } from "@/modules/today/types";
import { dayRate } from "@/modules/today/sla";

type Props = {
  scores: DayScore[];
  height?: number;
};

export function SlaChart({ scores, height = 220 }: Props) {
  const data = scores
    .map((s) => {
      const r = dayRate(s);
      return {
        date: s.date,
        label: format(parseISO(s.date), "d MMM"),
        pct: r === null ? null : Math.round(r * 100),
        expected: s.expected,
        completed: s.completed,
      };
    })
    .filter((d) => d.pct !== null);

  if (data.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        No scored days yet (need expected tasks)
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "oklch(0.7 0.02 250)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "oklch(0.7 0.02 250)" }}
            tickLine={false}
            axisLine={false}
            width={36}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              background: "oklch(0.18 0.02 250)",
              border: "1px solid oklch(1 0 0 / 12%)",
              borderRadius: 12,
              fontSize: 12,
            }}
            formatter={(value, _n, item) => {
              const p = item?.payload as {
                completed?: number;
                expected?: number;
              };
              return [
                `${value}% (${p?.completed ?? 0}/${p?.expected ?? 0})`,
                "Done",
              ];
            }}
          />
          <Line
            type="monotone"
            dataKey="pct"
            stroke="oklch(0.72 0.15 165)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "oklch(0.72 0.15 165)" }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
