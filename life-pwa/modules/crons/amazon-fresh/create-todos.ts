import {
  createTodayTask,
  listTasksForDate,
} from "@/modules/manual/lib/api";
import type { Deal } from "@/modules/crons/amazon-fresh/types";

function extractAsinFromText(text: string): string | undefined {
  const m = text.match(/\b([A-Z0-9]{10})\b/i);
  // Prefer /dp/ form
  const dp = text.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  return (dp?.[1] || m?.[1])?.toUpperCase();
}

function normalizeProductKey(text: string): string | null {
  const asin = extractAsinFromText(text);
  if (asin) return `asin:${asin}`;
  try {
    if (text.includes("amazon.")) {
      const u = new URL(text.startsWith("http") ? text : `https://${text}`);
      return `path:${u.pathname.replace(/\/$/, "")}`;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function dealKey(deal: Deal): string {
  if (deal.asin) return `asin:${deal.asin}`;
  return `path:${new URL(deal.url).pathname.replace(/\/$/, "")}`;
}

function taskMatchesDeal(
  task: { title: string; notes: string | null },
  deal: Deal
): boolean {
  const hay = `${task.title}\n${task.notes ?? ""}`;
  const key = dealKey(deal);
  const existing = normalizeProductKey(hay);
  if (existing && existing === key) return true;
  if (deal.asin && hay.toUpperCase().includes(deal.asin)) return true;
  if (task.notes && deal.url && task.notes.includes(deal.url)) return true;
  if (task.notes && deal.asin && task.notes.toUpperCase().includes(deal.asin))
    return true;
  return false;
}

export type CreateTodosResult = {
  added: number;
  skipped: number;
  titles: string[];
};

/**
 * Create Today todos for deals not already present today.
 */
export async function createTodosForDeals(
  deals: Deal[]
): Promise<CreateTodosResult> {
  const existing = await listTasksForDate(new Date());
  let added = 0;
  let skipped = 0;
  const titles: string[] = [];

  for (const deal of deals) {
    if (existing.some((t) => taskMatchesDeal(t, deal))) {
      skipped += 1;
      continue;
    }

    const title = `Fresh: ${deal.title} · ${deal.discountPct}% off`;
    const task = await createTodayTask({
      title,
      notes: deal.url,
    });
    existing.push(task);
    added += 1;
    titles.push(title);
  }

  return { added, skipped, titles };
}
