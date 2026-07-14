"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DayStat } from "@/lib/tasks";

type Props = {
  days: DayStat[];
  height?: number;
};

export function ConsistencyChart({ days, height = 260 }: Props) {
  const data = days.slice(-14); // last 2 weeks for readability

  if (data.every((d) => d.completed === 0)) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-4 text-center text-sm text-muted-foreground">
        Complete tasks to see your consistency chart
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "oklch(0.7 0.02 260)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "oklch(0.7 0.02 260)" }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <Tooltip
            cursor={{ fill: "oklch(1 0 0 / 6%)" }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid oklch(1 0 0 / 12%)",
              background: "oklch(0.19 0.015 260)",
              fontSize: 13,
              fontWeight: 600,
            }}
            formatter={(value) => [Number(value), "Completed"]}
            labelFormatter={(label) => String(label)}
          />
          <Bar
            dataKey="completed"
            fill="oklch(0.72 0.14 280)"
            radius={[6, 6, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
