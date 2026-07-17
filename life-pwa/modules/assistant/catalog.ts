import { loadTodaySections } from "@/modules/today/aggregate";
import type { TodaySection } from "@/modules/today/types";
import type { CatalogItem } from "@/modules/assistant/types";

export function sectionsToCatalog(sections: TodaySection[]): CatalogItem[] {
  const items: CatalogItem[] = [];
  for (const s of sections) {
    for (const it of s.items) {
      items.push({
        id: it.id,
        sourceKey: s.sourceKey,
        title: it.title,
        subtitle: it.subtitle,
        status: it.status,
        canComplete:
          it.completeAction === "toggle" && Boolean(s.completeItem),
      });
    }
  }
  return items;
}

export async function loadTodayCatalog(
  date: Date = new Date()
): Promise<{ sections: TodaySection[]; catalog: CatalogItem[] }> {
  const sections = await loadTodaySections(date);
  return { sections, catalog: sectionsToCatalog(sections) };
}

export function formatCatalogForPrompt(catalog: CatalogItem[]): string {
  if (catalog.length === 0) return "(no items today)";
  return catalog
    .map((c) => {
      const bits = [
        `id=${c.id}`,
        `source=${c.sourceKey}`,
        `status=${c.status}`,
        `canComplete=${c.canComplete}`,
        `title=${JSON.stringify(c.title)}`,
      ];
      if (c.subtitle) bits.push(`subtitle=${JSON.stringify(c.subtitle)}`);
      return `- ${bits.join(" ")}`;
    })
    .join("\n");
}
