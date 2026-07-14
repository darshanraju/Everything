"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { SubNav } from "@/components/shell/sub-nav";
import { Label } from "@/components/ui/label";
import { WEEKDAYS, type Program, type WeeklyPlanDay } from "@/lib/schema";
import { FITNESS_SUBNAV } from "@/modules/fitness/nav";
import {
  getWeeklyPlan,
  listPrograms,
  setWeeklyPlanDay,
} from "@/modules/fitness/lib/api";

export default function WeekPage() {
  const [plan, setPlan] = useState<WeeklyPlanDay[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [p, pr] = await Promise.all([getWeeklyPlan(), listPrograms()]);
    setPlan(p);
    setPrograms(pr);
  }

  useEffect(() => {
    void refresh()
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, []);

  async function onChange(weekday: number, raw: string) {
    setError(null);
    try {
      if (raw === "rest") {
        await setWeeklyPlanDay(weekday, { is_rest: true, program_id: null });
      } else {
        await setWeeklyPlanDay(weekday, {
          is_rest: false,
          program_id: raw,
        });
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <AppShell title="Weekly plan" subtitle="Program or rest for each day">
      <SubNav items={FITNESS_SUBNAV} />

      {loading ? (
        <p className="text-muted-foreground">
          <Loader2 className="inline size-4 animate-spin" /> Loading…
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {WEEKDAYS.map((wd) => {
            const day = plan.find((d) => d.weekday === wd.value);
            const value = day?.is_rest || !day?.program_id ? "rest" : day.program_id;
            return (
              <div
                key={wd.value}
                className="rounded-xl border border-border/80 bg-card px-4 py-3"
              >
                <Label className="mb-2 block font-semibold">{wd.label}</Label>
                <select
                  value={value ?? "rest"}
                  onChange={(e) => void onChange(wd.value, e.target.value)}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="rest">Rest</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
          {programs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Create a program first, then assign it to days.
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </AppShell>
  );
}
