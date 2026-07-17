import { addDays, startOfDay } from "date-fns";
import {
  createTodayTask,
  normalizeTaskLink,
  rescheduleTodayTask,
} from "@/modules/manual/lib/api";
import { matchItem } from "@/modules/assistant/match";
import type {
  AssistantAction,
  CatalogItem,
  NeedsConfirm,
} from "@/modules/assistant/types";
import type { TodaySection } from "@/modules/today/types";

export type ToolCallResult = {
  /** JSON-ish string returned to the model */
  content: string;
  actions: AssistantAction[];
  needsConfirm?: NeedsConfirm;
  /** Stop the tool loop (e.g. waiting for user confirm) */
  stop?: boolean;
};

function findInSections(sections: TodaySection[], itemId: string) {
  for (const section of sections) {
    const item = section.items.find((i) => i.id === itemId);
    if (item) return { section, item };
  }
  return null;
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  ctx: { sections: TodaySection[]; catalog: CatalogItem[] }
): Promise<ToolCallResult> {
  const actions: AssistantAction[] = [];

  if (name === "list_pending") {
    const pending = ctx.catalog.filter((c) => c.status === "pending");
    return {
      content: JSON.stringify({
        count: pending.length,
        items: pending.map((p) => ({
          id: p.id,
          title: p.title,
          source: p.sourceKey,
        })),
      }),
      actions: [
        {
          type: "list_pending",
          title: `${pending.length} pending`,
          ok: true,
        },
      ],
    };
  }

  if (name === "add_today_todo") {
    const title = String(args.title ?? "").trim();
    if (!title) {
      return {
        content: JSON.stringify({ error: "title required" }),
        actions: [{ type: "add_today_todo", title: "", ok: false }],
      };
    }
    const linkRaw =
      typeof args.link === "string"
        ? args.link
        : typeof args.notes === "string"
          ? args.notes
          : undefined;
    const notes = normalizeTaskLink(linkRaw);
    const task = await createTodayTask({ title, notes });
    actions.push({
      type: "add_today_todo",
      title: task.title,
      itemId: `manual:task:${task.id}`,
      ok: true,
    });
    return {
      content: JSON.stringify({
        ok: true,
        id: task.id,
        title: task.title,
        link: notes,
      }),
      actions,
    };
  }

  if (name === "complete_today_item") {
    const itemId =
      typeof args.item_id === "string" ? args.item_id.trim() : "";
    const query = typeof args.query === "string" ? args.query.trim() : "";

    let targetId = itemId;
    if (!targetId && query) {
      const m = matchItem(query, ctx.catalog, {
        pendingOnly: true,
        completableOnly: true,
      });
      if (m.kind === "none") {
        return {
          content: JSON.stringify({
            error: "no_match",
            query,
            hint: "No pending completable item matched",
          }),
          actions: [
            {
              type: "complete_today_item",
              title: query,
              ok: false,
              message: "No match",
            },
          ],
        };
      }
      if (m.kind === "ambiguous") {
        const needsConfirm: NeedsConfirm = {
          itemId: m.item.id,
          title: m.item.title,
          reason: `Also similar: ${m.alternatives.map((a) => a.title).join(", ")}`,
        };
        return {
          content: JSON.stringify({
            needs_confirm: true,
            best: { id: m.item.id, title: m.item.title },
            alternatives: m.alternatives.map((a) => ({
              id: a.id,
              title: a.title,
            })),
          }),
          actions: [],
          needsConfirm,
          stop: true,
        };
      }
      targetId = m.item.id;
    }

    if (!targetId) {
      return {
        content: JSON.stringify({ error: "item_id or query required" }),
        actions: [
          {
            type: "complete_today_item",
            title: "",
            ok: false,
            message: "Missing id/query",
          },
        ],
      };
    }

    const found = findInSections(ctx.sections, targetId);
    if (!found) {
      return {
        content: JSON.stringify({ error: "unknown_id", item_id: targetId }),
        actions: [
          {
            type: "complete_today_item",
            title: targetId,
            itemId: targetId,
            ok: false,
            message: "Unknown item",
          },
        ],
      };
    }

    if (found.item.status === "done") {
      return {
        content: JSON.stringify({
          ok: true,
          already_done: true,
          title: found.item.title,
        }),
        actions: [
          {
            type: "complete_today_item",
            title: found.item.title,
            itemId: found.item.id,
            ok: true,
            message: "Already done",
          },
        ],
      };
    }

    if (!found.section.completeItem || found.item.completeAction !== "toggle") {
      return {
        content: JSON.stringify({
          error: "not_completable",
          title: found.item.title,
          hint: found.item.href
            ? `Open ${found.item.href} in the app`
            : "Not toggleable",
        }),
        actions: [
          {
            type: "complete_today_item",
            title: found.item.title,
            itemId: found.item.id,
            ok: false,
            message: "Not completable via voice",
          },
        ],
      };
    }

    await found.section.completeItem(found.item);
    actions.push({
      type: "complete_today_item",
      title: found.item.title,
      itemId: found.item.id,
      ok: true,
    });
    return {
      content: JSON.stringify({ ok: true, title: found.item.title }),
      actions,
    };
  }

  if (name === "uncomplete_today_item") {
    const itemId = String(args.item_id ?? "").trim();
    const found = findInSections(ctx.sections, itemId);
    if (!found) {
      return {
        content: JSON.stringify({ error: "unknown_id" }),
        actions: [
          {
            type: "uncomplete_today_item",
            title: itemId,
            ok: false,
          },
        ],
      };
    }
    if (
      found.item.status !== "done" ||
      !found.section.completeItem ||
      found.item.completeAction !== "toggle"
    ) {
      return {
        content: JSON.stringify({ error: "cannot_uncomplete" }),
        actions: [
          {
            type: "uncomplete_today_item",
            title: found.item.title,
            itemId: found.item.id,
            ok: false,
          },
        ],
      };
    }
    await found.section.completeItem(found.item);
    return {
      content: JSON.stringify({ ok: true, title: found.item.title }),
      actions: [
        {
          type: "uncomplete_today_item",
          title: found.item.title,
          itemId: found.item.id,
          ok: true,
        },
      ],
    };
  }

  if (name === "reschedule_today_todo") {
    const itemId =
      typeof args.item_id === "string" ? args.item_id.trim() : "";
    const query = typeof args.query === "string" ? args.query.trim() : "";

    let targetId = itemId;
    if (!targetId && query) {
      const manualOnly = ctx.catalog.filter(
        (c) => c.sourceKey === "manual" && c.status === "pending"
      );
      const m = matchItem(query, manualOnly, { pendingOnly: true });
      if (m.kind === "none") {
        return {
          content: JSON.stringify({ error: "no_match", query }),
          actions: [
            {
              type: "reschedule_today_todo",
              title: query,
              ok: false,
              message: "No matching todo",
            },
          ],
        };
      }
      if (m.kind === "ambiguous") {
        return {
          content: JSON.stringify({
            needs_confirm: true,
            best: { id: m.item.id, title: m.item.title },
          }),
          actions: [],
          needsConfirm: {
            itemId: m.item.id,
            title: m.item.title,
            reason: "Ambiguous — reschedule not auto-applied",
          },
          stop: true,
        };
      }
      targetId = m.item.id;
    }

    const found = targetId ? findInSections(ctx.sections, targetId) : null;
    if (!found || found.section.sourceKey !== "manual") {
      return {
        content: JSON.stringify({
          error: "only_manual_todos",
          hint: "Only Yours todos can be pushed to a future day",
        }),
        actions: [
          {
            type: "reschedule_today_todo",
            title: targetId,
            ok: false,
          },
        ],
      };
    }
    const taskId = found.item.meta?.taskId as string | undefined;
    if (!taskId) {
      return {
        content: JSON.stringify({ error: "missing_task_id" }),
        actions: [
          {
            type: "reschedule_today_todo",
            title: found.item.title,
            ok: false,
          },
        ],
      };
    }

    let dueOn: Date | null = null;
    if (typeof args.due_on === "string" && /^\d{4}-\d{2}-\d{2}$/.test(args.due_on)) {
      dueOn = startOfDay(new Date(`${args.due_on}T12:00:00`));
    } else if (typeof args.days_ahead === "number" && args.days_ahead >= 1) {
      dueOn = startOfDay(addDays(new Date(), Math.floor(args.days_ahead)));
    }
    if (!dueOn) {
      return {
        content: JSON.stringify({
          error: "due_on or days_ahead required",
        }),
        actions: [
          {
            type: "reschedule_today_todo",
            title: found.item.title,
            ok: false,
          },
        ],
      };
    }

    try {
      const task = await rescheduleTodayTask(taskId, dueOn);
      return {
        content: JSON.stringify({
          ok: true,
          title: task.title,
          due_on: task.due_on,
        }),
        actions: [
          {
            type: "reschedule_today_todo",
            title: `${task.title} → ${task.due_on}`,
            itemId: found.item.id,
            ok: true,
          },
        ],
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Reschedule failed";
      return {
        content: JSON.stringify({ error: message }),
        actions: [
          {
            type: "reschedule_today_todo",
            title: found.item.title,
            ok: false,
            message,
          },
        ],
      };
    }
  }

  return {
    content: JSON.stringify({ error: `unknown_tool:${name}` }),
    actions: [],
  };
}

/** Direct complete by id (user confirmed in UI). */
export async function confirmCompleteItem(
  itemId: string,
  sections: TodaySection[]
): Promise<ToolCallResult> {
  return executeTool(
    "complete_today_item",
    { item_id: itemId },
    {
      sections,
      catalog: [],
    }
  );
}
