export type Deal = {
  title: string;
  /** Absolute product URL */
  url: string;
  asin?: string;
  discountPct: number;
  sourceUrl: string;
};

export type PageFetchResult =
  | { ok: true; html: string; via: "plain" | "scrapingbee" }
  | { ok: false; error: string; via?: "plain" | "scrapingbee" };
