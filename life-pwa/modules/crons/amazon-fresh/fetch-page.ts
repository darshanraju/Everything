import { BROWSER_UA } from "@/modules/crons/amazon-fresh/config";
import type { PageFetchResult } from "@/modules/crons/amazon-fresh/types";

const BOT_MARKERS = [
  "robot check",
  "validatecaptcha",
  "opfcaptcha",
  "api-services-support@amazon.com",
  "enter the characters you see below",
  "sorry, we just need to make sure you're not a robot",
];

function looksBlocked(html: string): boolean {
  if (html.length < 2_000) return true;
  const lower = html.toLowerCase();
  return BOT_MARKERS.some((m) => lower.includes(m));
}

async function plainFetch(url: string): Promise<PageFetchResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_UA,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
      redirect: "follow",
    });
    if (!res.ok) {
      return {
        ok: false,
        error: `HTTP ${res.status}`,
        via: "plain",
      };
    }
    const html = await res.text();
    if (looksBlocked(html)) {
      return {
        ok: false,
        error: "Bot wall or empty response",
        via: "plain",
      };
    }
    return { ok: true, html, via: "plain" };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Plain fetch failed",
      via: "plain",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function scrapingBeeFetch(
  url: string,
  apiKey: string
): Promise<PageFetchResult> {
  const params = new URLSearchParams({
    api_key: apiKey,
    url,
    render_js: "true",
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(
      `https://app.scrapingbee.com/api/v1/?${params}`,
      {
        signal: controller.signal,
        cache: "no-store",
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        error: `ScrapingBee HTTP ${res.status}: ${body.slice(0, 120)}`,
        via: "scrapingbee",
      };
    }
    const html = await res.text();
    if (looksBlocked(html)) {
      return {
        ok: false,
        error: "Bot wall after ScrapingBee",
        via: "scrapingbee",
      };
    }
    return { ok: true, html, via: "scrapingbee" };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "ScrapingBee failed",
      via: "scrapingbee",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Plain fetch first; ScrapingBee if key present and plain fails.
 */
export async function fetchPage(
  url: string,
  scrapingBeeKey: string | null
): Promise<PageFetchResult> {
  const plain = await plainFetch(url);
  if (plain.ok) return plain;
  if (!scrapingBeeKey) return plain;
  return scrapingBeeFetch(url, scrapingBeeKey);
}
