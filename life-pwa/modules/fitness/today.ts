import { startOfDay, endOfDay } from "date-fns";
import type {
  DayScore,
  TodayContributor,
  TodayItem,
} from "@/modules/today/types";
import {
  getWeeklyPlan,
  listProgramExercises,
  todayWeekday,
} from "@/modules/fitness/lib/api";
import { getActiveSession } from "@/modules/fitness/lib/sessions";
import { db } from "@/lib/supabase/client";
import { dateKey, dayBounds, eachLocalDay } from "@/modules/today/dates";

/**
 * Fitness → Today: one primary item for today's planned workout (or rest).
 * Status done if a finished session exists today.
 */
export const fitnessTodayContributor: TodayContributor = {
  sourceKey: "fitness",
  label: "Fitness",
  enabled: true,

  async getItems(date: Date): Promise<TodayItem[]> {
    const weekday = todayWeekday(date);
    const [plan, active] = await Promise.all([
      getWeeklyPlan(),
      getActiveSession(),
    ]);
    const day = plan.find((d) => d.weekday === weekday);

    const start = startOfDay(date).toISOString();
    const end = endOfDay(date).toISOString();
    const { data: finishedToday } = await db()
      .from("workout_sessions")
      .select("id, program_id, name, finished_at")
      .not("finished_at", "is", null)
      .gte("finished_at", start)
      .lte("finished_at", end)
      .order("finished_at", { ascending: false })
      .limit(5);

    const doneToday = (finishedToday ?? []).length > 0;
    const finishedMatch =
      (finishedToday ?? []).find(
        (s) => day?.program_id && s.program_id === day.program_id
      ) ?? finishedToday?.[0];

    if (active && !active.finished_at) {
      return [
        {
          id: `fitness:active:${active.id}`,
          sourceKey: "fitness",
          title: `Resume: ${active.name || "Workout"}`,
          subtitle: "In progress",
          href: `/fitness/workout/${active.id}`,
          status: "pending",
          sortOrder: 0,
          completeAction: "none",
          meta: { sessionId: active.id },
        },
      ];
    }

    if (!day || day.is_rest || !day.program_id || !day.program) {
      if (doneToday && finishedMatch) {
        return [
          {
            id: `fitness:done:${finishedMatch.id}`,
            sourceKey: "fitness",
            title: `Done: ${finishedMatch.name || "Workout"}`,
            subtitle: "Finished today",
            href: `/fitness/history/${finishedMatch.id}`,
            status: "done",
            sortOrder: 0,
            completeAction: "none",
          },
        ];
      }
      return [
        {
          id: "fitness:rest",
          sourceKey: "fitness",
          title: "Rest day",
          subtitle: "No program scheduled · edit week anytime",
          href: "/fitness/week",
          status: "done",
          sortOrder: 0,
          completeAction: "none",
        },
      ];
    }

    let exerciseNames = "";
    try {
      const pe = await listProgramExercises(day.program_id);
      exerciseNames = pe
        .map((x) => x.exercise?.name)
        .filter(Boolean)
        .slice(0, 6)
        .join(" · ");
      if (pe.length > 6) exerciseNames += "…";
    } catch {
      /* ignore */
    }

    if (doneToday) {
      const fin = finishedMatch;
      return [
        {
          id: `fitness:done:${fin?.id ?? day.program_id}`,
          sourceKey: "fitness",
          title: `Workout: ${day.program.name}`,
          subtitle: exerciseNames || "Completed today",
          href: fin?.id ? `/fitness/history/${fin.id}` : "/fitness/history",
          status: "done",
          sortOrder: 0,
          completeAction: "none",
        },
      ];
    }

    return [
      {
        id: `fitness:program:${day.program_id}`,
        sourceKey: "fitness",
        title: `Workout: ${day.program.name}`,
        subtitle: exerciseNames || "Tap to open Fitness and start",
        href: "/fitness",
        status: "pending",
        sortOrder: 0,
        completeAction: "none",
        meta: { programId: day.program_id },
      },
    ];
  },

  async getDayScores(from: Date, to: Date): Promise<DayScore[]> {
    const plan = await getWeeklyPlan();
    const planByWeekday = new Map(plan.map((d) => [d.weekday, d]));

    const { start } = dayBounds(from);
    const { end } = dayBounds(to);
    const { data: sessions } = await db()
      .from("workout_sessions")
      .select("id, program_id, finished_at")
      .not("finished_at", "is", null)
      .gte("finished_at", start)
      .lte("finished_at", end);

    const finishedByDay = new Map<string, { program_id: string | null }[]>();
    for (const s of sessions ?? []) {
      if (!s.finished_at) continue;
      const key = dateKey(new Date(s.finished_at as string));
      const list = finishedByDay.get(key) ?? [];
      list.push({ program_id: (s.program_id as string) ?? null });
      finishedByDay.set(key, list);
    }

    return eachLocalDay(from, to).map((d) => {
      const key = dateKey(d);
      const wd = todayWeekday(d);
      const day = planByWeekday.get(wd);
      const isTraining =
        day && !day.is_rest && !!day.program_id;
      if (!isTraining) {
        return { date: key, expected: 0, completed: 0 };
      }
      const finished = finishedByDay.get(key) ?? [];
      const match =
        finished.some((s) => s.program_id === day!.program_id) ||
        finished.length > 0;
      return {
        date: key,
        expected: 1,
        completed: match ? 1 : 0,
      };
    });
  },
};
