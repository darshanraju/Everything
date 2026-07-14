import type {
  DayScore,
  TodayContributor,
  TodayItem,
} from "@/modules/today/types";
import {
  listProtocols,
  logDose,
  logsTodayForProtocol,
} from "@/modules/health/lib/api";
import { categoryLabel } from "@/lib/schema";
import {
  formatProtocolFrequency,
  isProtocolDueOn,
} from "@/modules/health/lib/schedule";
import { db } from "@/lib/supabase/client";
import { dateKey, dayBounds, eachLocalDay } from "@/modules/today/dates";

/**
 * Health → Today: active protocols due on that calendar day
 * (weekly/custom respect schedule_weekdays).
 */
export const healthTodayContributor: TodayContributor = {
  sourceKey: "health",
  label: "Health",
  enabled: true,

  async getItems(date: Date): Promise<TodayItem[]> {
    const protocols = await listProtocols(true);
    const due = protocols.filter((p) => isProtocolDueOn(p, date));
    const items: TodayItem[] = [];

    await Promise.all(
      due.map(async (p, index) => {
        const logs = await logsTodayForProtocol(p.id);
        const done = logs.length > 0;
        const dose =
          p.amount != null ? `${Number(p.amount)} ${p.unit}` : "As directed";
        const syringe =
          p.category === "peptide" && p.syringe_units != null
            ? ` · Pull ${Number(p.syringe_units)} units`
            : "";

        items.push({
          id: `health:protocol:${p.id}`,
          sourceKey: "health",
          title: p.name,
          subtitle: `${categoryLabel(p.category)} · ${dose}${syringe} · ${formatProtocolFrequency(p)}`,
          href: `/health/protocols/${p.id}`,
          status: done ? "done" : "pending",
          sortOrder: index,
          completeAction: done ? "none" : "toggle",
          meta: { protocolId: p.id },
        });
      })
    );

    items.sort((a, b) => {
      if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });
    return items;
  },

  async completeItem(item) {
    const protocolId = item.meta?.protocolId as string | undefined;
    if (!protocolId) return;
    if (item.status === "done") return;
    await logDose({ protocol_id: protocolId });
  },

  async getDayScores(from: Date, to: Date): Promise<DayScore[]> {
    const protocols = await listProtocols(true);

    if (protocols.length === 0) {
      return eachLocalDay(from, to).map((d) => ({
        date: dateKey(d),
        expected: 0,
        completed: 0,
      }));
    }

    const protocolIds = protocols.map((p) => p.id);
    const { start } = dayBounds(from);
    const { end } = dayBounds(to);
    const { data: logs } = await db()
      .from("peptide_logs")
      .select("protocol_id, taken_at")
      .in("protocol_id", protocolIds)
      .gte("taken_at", start)
      .lte("taken_at", end);

    const loggedByDay = new Map<string, Set<string>>();
    for (const log of logs ?? []) {
      const key = dateKey(new Date(log.taken_at as string));
      const set = loggedByDay.get(key) ?? new Set();
      set.add(log.protocol_id as string);
      loggedByDay.set(key, set);
    }

    return eachLocalDay(from, to).map((d) => {
      const key = dateKey(d);
      const due = protocols.filter((p) => isProtocolDueOn(p, d));
      const expected = due.length;
      const set = loggedByDay.get(key);
      let completed = 0;
      if (set) {
        for (const p of due) {
          if (set.has(p.id)) completed++;
        }
      }
      return { date: key, expected, completed };
    });
  },
};
