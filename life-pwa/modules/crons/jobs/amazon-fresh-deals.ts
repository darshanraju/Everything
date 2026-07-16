import { loadAmazonFreshConfig } from "@/modules/crons/amazon-fresh/config";
import { createTodosForDeals } from "@/modules/crons/amazon-fresh/create-todos";
import { fetchPage } from "@/modules/crons/amazon-fresh/fetch-page";
import { parseDeals } from "@/modules/crons/amazon-fresh/parse-deals";
import type { Deal } from "@/modules/crons/amazon-fresh/types";
import type { CronJob } from "@/modules/crons/types";

export const amazonFreshDealsJob: CronJob = {
  id: "amazon-fresh-deals",
  name: "Amazon Fresh deals",
  description:
    "Scan 2 Fresh links for ≥50% off; add deals to Today todos with links.",
  schedule: "0 14 * * *",
  scheduleLabel: "Daily 7:00 AM PT (14:00 UTC)",
  enabled: true,

  async run() {
    const config = loadAmazonFreshConfig();
    if (config.urls.length === 0) {
      return {
        ok: false,
        summary: "Set AMAZON_FRESH_URL_1 and AMAZON_FRESH_URL_2 in env",
        detail: { configuredUrls: 0 },
      };
    }

    const pageResults: Array<{
      url: string;
      ok: boolean;
      via?: string;
      error?: string;
      dealCount: number;
    }> = [];
    const allDeals: Deal[] = [];

    for (const url of config.urls) {
      const page = await fetchPage(url, config.scrapingBeeKey);
      if (!page.ok) {
        pageResults.push({
          url,
          ok: false,
          via: page.via,
          error: page.error,
          dealCount: 0,
        });
        continue;
      }
      const deals = parseDeals(page.html, config.minDiscountPct, url);
      allDeals.push(...deals);
      pageResults.push({
        url,
        ok: true,
        via: page.via,
        dealCount: deals.length,
      });
    }

    // Dedupe across pages by ASIN/url
    const unique = new Map<string, Deal>();
    for (const d of allDeals) {
      const key = d.asin || d.url;
      const prev = unique.get(key);
      if (!prev || d.discountPct > prev.discountPct) unique.set(key, d);
    }
    const deals = Array.from(unique.values());

    const pagesOk = pageResults.filter((p) => p.ok).length;
    if (pagesOk === 0) {
      return {
        ok: false,
        summary: `All pages failed (${pageResults.length}). Try SCRAPINGBEE_API_KEY.`,
        detail: { pages: pageResults, minDiscountPct: config.minDiscountPct },
      };
    }

    const todos = await createTodosForDeals(deals);

    const summary = `${todos.added} deal${todos.added === 1 ? "" : "s"} added · ${todos.skipped} skipped dup · ${deals.length} found (≥${config.minDiscountPct}%) · ${pagesOk}/${pageResults.length} pages ok`;

    return {
      ok: true,
      summary,
      detail: {
        minDiscountPct: config.minDiscountPct,
        pages: pageResults,
        found: deals.length,
        added: todos.added,
        skipped: todos.skipped,
        sample: todos.titles.slice(0, 5),
      },
    };
  },
};
