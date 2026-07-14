import { TODAY_CONTRIBUTORS } from "@/modules/today/contributors";
import type { TodaySection } from "@/modules/today/types";

export async function loadTodaySections(
  date: Date = new Date()
): Promise<TodaySection[]> {
  const enabled = TODAY_CONTRIBUTORS.filter((c) => c.enabled);
  const sections = await Promise.all(
    enabled.map(async (c) => {
      try {
        const items = await c.getItems(date);
        return {
          sourceKey: c.sourceKey,
          label: c.label,
          items,
          completeItem: c.completeItem
            ? (item: Parameters<NonNullable<typeof c.completeItem>>[0]) =>
                c.completeItem!(item)
            : undefined,
        } satisfies TodaySection;
      } catch (e) {
        // Don't break whole Today if one module fails (e.g. missing migration)
        console.error(`Today contributor ${c.sourceKey} failed`, e);
        return {
          sourceKey: c.sourceKey,
          label: c.label,
          items: [
            {
              id: `${c.sourceKey}:error`,
              sourceKey: c.sourceKey,
              title: `Couldn’t load ${c.label}`,
              subtitle:
                e instanceof Error ? e.message : "Check Supabase migrations",
              status: "pending" as const,
              completeAction: "none" as const,
            },
          ],
        };
      }
    })
  );
  return sections;
}

export function countPending(sections: TodaySection[]): number {
  return sections.reduce(
    (n, s) => n + s.items.filter((i) => i.status === "pending").length,
    0
  );
}
