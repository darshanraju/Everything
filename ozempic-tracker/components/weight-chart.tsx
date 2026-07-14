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
import { formatWeekOf } from "@/lib/weeks";
import { formatKg } from "@/lib/units";
import type { WeeklyLog } from "@/lib/schema";

type Props = {
  logs: WeeklyLog[];
  height?: number;
};

export function WeightChart({ logs, height = 260 }: Props) {
  const data = [...logs]
    .sort((a, b) => a.week_of.localeCompare(b.week_of))
    .map((log) => ({
      week_of: log.week_of,
      label: formatWeekOf(log.week_of, "d MMM"),
      weight_kg: Number(log.weight_kg),
    }));

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-primary/20 bg-soft-rose/30 px-4 text-center text-base text-muted-foreground">
        Log your weight to see your progress chart
      </div>
    );
  }

  const weights = data.map((d) => d.weight_kg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const pad = Math.max(0.5, (max - min) * 0.15 || 1);

  const primaryStroke = "oklch(0.62 0.14 350)";
  const mutedTick = "oklch(0.48 0.035 340)";
  const gridStroke = "oklch(0.9 0.03 350)";

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="4 6" stroke={gridStroke} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 13, fill: mutedTick, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            dy={6}
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tick={{ fontSize: 13, fill: mutedTick, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v) => `${Number(v).toFixed(0)}`}
            label={{
              value: "kg",
              angle: -90,
              position: "insideLeft",
              style: {
                fontSize: 13,
                fill: mutedTick,
                fontWeight: 700,
              },
            }}
          />
          <Tooltip
            formatter={(value) => [formatKg(Number(value)), "Weight"]}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload as
                | { week_of?: string }
                | undefined;
              return p?.week_of
                ? `Week of ${formatWeekOf(p.week_of)}`
                : "";
            }}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid oklch(0.9 0.03 350)",
              background: "oklch(0.995 0.006 350)",
              fontSize: 14,
              fontWeight: 600,
              boxShadow: "0 8px 24px oklch(0.55 0.08 350 / 0.1)",
            }}
          />
          <Line
            type="monotone"
            dataKey="weight_kg"
            stroke={primaryStroke}
            strokeWidth={3}
            dot={{
              r: 5,
              fill: primaryStroke,
              stroke: "#fff",
              strokeWidth: 2,
            }}
            activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
