import type { CatalogItem } from "@/modules/assistant/types";

const STOP = new Set([
  "a",
  "an",
  "the",
  "my",
  "i",
  "just",
  "took",
  "take",
  "done",
  "todo",
  "task",
  "item",
  "check",
  "off",
  "complete",
  "completed",
  "finish",
  "finished",
  "mark",
  "this",
  "that",
  "today",
  "please",
]);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

export function scoreMatch(query: string, item: CatalogItem): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const title = item.title.toLowerCase();
  const sub = (item.subtitle ?? "").toLowerCase();
  const hay = `${title} ${sub}`;

  if (hay === q || title === q) return 100;
  if (title.includes(q) || hay.includes(q)) return 80;
  if (q.includes(title) && title.length > 3) return 70;

  const qt = tokens(query);
  if (qt.length === 0) return 0;
  const ht = new Set(tokens(hay));
  let hit = 0;
  for (const t of qt) {
    if (ht.has(t)) hit += 1;
    else if ([...ht].some((h) => h.includes(t) || t.includes(h))) hit += 0.5;
  }
  return (hit / qt.length) * 60;
}

export type MatchOutcome =
  | { kind: "exact"; item: CatalogItem }
  | { kind: "ambiguous"; item: CatalogItem; alternatives: CatalogItem[] }
  | { kind: "none" };

/**
 * Match query against items. Prefer pending completable for complete actions.
 */
export function matchItem(
  query: string,
  catalog: CatalogItem[],
  opts: { pendingOnly?: boolean; completableOnly?: boolean } = {}
): MatchOutcome {
  let pool = catalog;
  if (opts.pendingOnly) pool = pool.filter((c) => c.status === "pending");
  if (opts.completableOnly) pool = pool.filter((c) => c.canComplete);

  const scored = pool
    .map((item) => ({ item, score: scoreMatch(query, item) }))
    .filter((x) => x.score >= 20)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { kind: "none" };
  const top = scored[0];
  const second = scored[1];
  if (!second || top.score >= second.score + 15 || top.score >= 70) {
    return { kind: "exact", item: top.item };
  }
  return {
    kind: "ambiguous",
    item: top.item,
    alternatives: scored.slice(1, 4).map((s) => s.item),
  };
}
