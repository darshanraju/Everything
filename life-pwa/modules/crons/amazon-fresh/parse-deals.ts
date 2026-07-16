import * as cheerio from "cheerio";
import type { Deal } from "@/modules/crons/amazon-fresh/types";

const ASIN_RE = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i;
const PCT_OFF_RE =
  /(?:save\s*)?(\d{1,2})\s*%\s*off|-\s*(\d{1,2})\s*%|(\d{1,2})\s*%\s*savings/i;

const MAX_DEALS = 30;

function extractAsin(href: string): string | undefined {
  const m = href.match(ASIN_RE);
  return m?.[1]?.toUpperCase();
}

function absoluteAmazonUrl(href: string): string | null {
  if (!href || href.startsWith("javascript:")) return null;
  try {
    if (href.startsWith("http")) {
      const u = new URL(href);
      if (!u.hostname.includes("amazon.")) return null;
      return `${u.origin}${u.pathname}`;
    }
    if (href.startsWith("/")) {
      return `https://www.amazon.com${href.split("?")[0]}`;
    }
  } catch {
    return null;
  }
  return null;
}

function parsePriceText(text: string): number | null {
  const cleaned = text.replace(/,/g, "").match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  if (!cleaned) return null;
  const n = Number(cleaned[1]);
  return Number.isFinite(n) ? n : null;
}

function pctFromPrices(list: number, deal: number): number | null {
  if (list <= 0 || deal < 0 || deal >= list) return null;
  return Math.round(((list - deal) / list) * 100);
}

function extractPctFromText(text: string): number | null {
  const m = text.match(PCT_OFF_RE);
  if (!m) return null;
  const n = Number(m[1] || m[2] || m[3]);
  if (!Number.isFinite(n) || n < 1 || n > 99) return null;
  return n;
}

function cleanTitle(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, 120);
}

/**
 * Defensive multi-strategy parse of Amazon list/search HTML.
 */
export function parseDeals(
  html: string,
  minDiscountPct: number,
  sourceUrl: string
): Deal[] {
  const $ = cheerio.load(html);
  const byKey = new Map<string, Deal>();

  function addDeal(partial: {
    title?: string;
    href?: string;
    discountPct?: number | null;
  }) {
    if (!partial.href || partial.discountPct == null) return;
    if (partial.discountPct < minDiscountPct) return;
    const url = absoluteAmazonUrl(partial.href);
    if (!url) return;
    const asin = extractAsin(url);
    if (!asin && !url.includes("/dp/") && !url.includes("/gp/product/")) {
      // Prefer real product links
      return;
    }
    const title = cleanTitle(partial.title || asin || "Amazon deal");
    if (!title) return;
    const key = asin || url;
    const existing = byKey.get(key);
    if (existing && existing.discountPct >= partial.discountPct) return;
    byKey.set(key, {
      title,
      url: asin ? `https://www.amazon.com/dp/${asin}` : url,
      asin,
      discountPct: partial.discountPct,
      sourceUrl,
    });
  }

  // Strategy 1: product cards / search results with % off in nearby text
  const cardSelectors = [
    '[data-component-type="s-search-result"]',
    ".s-result-item",
    "[data-asin]",
    ".a-carousel-card",
    ".ProductCard-module__card",
    ".puis-card-container",
  ];

  for (const sel of cardSelectors) {
    $(sel).each((_, el) => {
      const $el = $(el);
      const asinAttr = $el.attr("data-asin")?.trim().toUpperCase();
      if (asinAttr && asinAttr.length !== 10) return;

      const text = $el.text();
      let pct = extractPctFromText(text);

      // List vs deal price inside card
      if (pct == null) {
        const prices: number[] = [];
        $el.find(".a-price .a-offscreen, .a-text-price .a-offscreen").each(
          (__, p) => {
            const v = parsePriceText($(p).text());
            if (v != null) prices.push(v);
          }
        );
        // Also bare price spans
        if (prices.length < 2) {
          $el.find(".a-price-whole").each((__, p) => {
            const v = parsePriceText($(p).text());
            if (v != null) prices.push(v);
          });
        }
        if (prices.length >= 2) {
          const deal = Math.min(...prices);
          const list = Math.max(...prices);
          pct = pctFromPrices(list, deal);
        }
      }

      if (pct == null || pct < minDiscountPct) return;

      let href =
        $el.find('a[href*="/dp/"]').first().attr("href") ||
        $el.find('a[href*="/gp/product/"]').first().attr("href") ||
        $el.find("a.a-link-normal").first().attr("href");

      if (!href && asinAttr) href = `/dp/${asinAttr}`;

      const title =
        $el.find("h2 span").first().text() ||
        $el.find("h2 a span").first().text() ||
        $el.find('[data-cy="title-recipe"]').text() ||
        $el.find("img").attr("alt") ||
        $el.find(".a-size-base-plus").first().text() ||
        $el.find(".a-text-normal").first().text();

      addDeal({ title, href, discountPct: pct });
    });
  }

  // Strategy 2: any anchor to /dp/ with nearby % off in parent
  $('a[href*="/dp/"], a[href*="/gp/product/"]').each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;
    const $parent = $(a).closest(
      "div, li, article, section, [data-asin], .s-result-item"
    );
    const blob = ($parent.length ? $parent : $(a).parent()).text();
    const pct = extractPctFromText(blob);
    if (pct == null) return;
    const title =
      $(a).attr("aria-label") ||
      $(a).find("span").first().text() ||
      $(a).text() ||
      $(a).find("img").attr("alt");
    addDeal({ title, href, discountPct: pct });
  });

  // Strategy 3: whole-document % off near product links (loose)
  if (byKey.size === 0) {
    const linkAsins = new Map<string, string>();
    $('a[href*="/dp/"]').each((_, a) => {
      const href = $(a).attr("href") || "";
      const asin = extractAsin(href);
      if (!asin) return;
      if (!linkAsins.has(asin)) {
        linkAsins.set(asin, href);
      }
    });
    // Scan for "XX% off" and associate with nearest prior ASIN in raw html — too fuzzy; skip if still empty
  }

  const deals = Array.from(byKey.values())
    .filter((d) => d.discountPct >= minDiscountPct)
    .sort((a, b) => b.discountPct - a.discountPct)
    .slice(0, MAX_DEALS);

  return deals;
}
