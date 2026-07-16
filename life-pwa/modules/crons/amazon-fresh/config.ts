export type AmazonFreshConfig = {
  urls: string[];
  minDiscountPct: number;
  scrapingBeeKey: string | null;
};

export function loadAmazonFreshConfig(): AmazonFreshConfig {
  const urls = [
    process.env.AMAZON_FRESH_URL_1?.trim(),
    process.env.AMAZON_FRESH_URL_2?.trim(),
  ].filter((u): u is string => Boolean(u));

  const raw = process.env.AMAZON_FRESH_MIN_DISCOUNT_PCT?.trim();
  const parsed = raw ? Number(raw) : 50;
  const minDiscountPct =
    Number.isFinite(parsed) && parsed > 0 && parsed <= 100 ? parsed : 50;

  return {
    urls,
    minDiscountPct,
    scrapingBeeKey: process.env.SCRAPINGBEE_API_KEY?.trim() || null,
  };
}

export const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
