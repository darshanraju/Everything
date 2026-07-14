"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";
import { AppShell } from "@/components/shell/app-shell";
import { SubNav } from "@/components/shell/sub-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BodyWeight } from "@/lib/schema";
import { FITNESS_SUBNAV } from "@/modules/fitness/nav";
import {
  deleteBodyWeight,
  listBodyWeights,
  upsertBodyWeight,
} from "@/modules/fitness/lib/api";

export default function WeightPage() {
  const [rows, setRows] = useState<BodyWeight[]>([]);
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [kg, setKg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setRows(await listBodyWeights());
  }

  useEffect(() => {
    void refresh()
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, []);

  const chartData = useMemo(
    () =>
      [...rows]
        .sort((a, b) => a.weighed_on.localeCompare(b.weighed_on))
        .map((r) => ({
          label: format(parseISO(r.weighed_on), "d MMM"),
          kg: Number(r.weight_kg),
        })),
    [rows]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = Number(kg);
    if (!w || w <= 0) return;
    setError(null);
    try {
      await upsertBodyWeight(date, w);
      setKg("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <AppShell title="Body weight" subtitle="All values in kilograms (kg)">
      <SubNav items={FITNESS_SUBNAV} />

      <form
        onSubmit={onSubmit}
        className="mb-5 grid gap-3 rounded-2xl border border-border/80 bg-card p-4"
      >
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11"
            />
          </div>
          <div>
            <Label>Weight (kg)</Label>
            <Input
              type="number"
              step="0.1"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              placeholder="e.g. 82.5"
              className="h-11"
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="rounded-full">
          Save weight
        </Button>
      </form>

      <Card className="mb-5 border-border/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length < 1 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Log weights to see the chart
            </p>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 10%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                  <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    width={40}
                    unit="kg"
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1a2230",
                      border: "1px solid #333",
                      borderRadius: 12,
                    }}
                    formatter={(v) => [`${Number(v).toFixed(1)} kg`, "Weight"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="kg"
                    stroke="oklch(0.72 0.15 165)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground">
          <Loader2 className="inline size-4 animate-spin" /> Loading…
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between rounded-xl border border-border/80 bg-card px-4 py-3"
            >
              <div>
                <p className="font-semibold tabular-nums">
                  {Number(r.weight_kg).toFixed(1)} kg
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(r.weighed_on), "d MMM yyyy")}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() =>
                  void deleteBodyWeight(r.id).then(refresh)
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
