import type { SharedLinkTag } from "@/lib/schema";
import { SHARED_LINK_TAGS, sharedTagLabel } from "@/lib/schema";

export { SHARED_LINK_TAGS, sharedTagLabel };
export type { SharedLinkTag };

export function tagBadgeClass(tag: string): string {
  switch (tag) {
    case "learning":
      return "bg-sky-500/15 text-sky-300 border-sky-500/30";
    case "fun":
      return "bg-pink-500/15 text-pink-300 border-pink-500/30";
    case "work":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "reference":
      return "bg-violet-500/15 text-violet-300 border-violet-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

/** Extract first http(s) URL from free text (share payloads often put URL in `text`). */
export function extractUrlFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = text.match(/https?:\/\/[^\s<>"']+/i);
  if (!m) return null;
  return m[0].replace(/[),.]+$/, "");
}

/** Prefer explicit url param; else pull URL from text. */
export function resolveSharedUrl(params: {
  url?: string | null;
  text?: string | null;
}): string {
  const direct = params.url?.trim();
  if (direct && /^https?:\/\//i.test(direct)) return direct;
  if (direct && direct.includes(".") && !direct.includes(" ")) {
    return direct.startsWith("http") ? direct : `https://${direct}`;
  }
  const fromText = extractUrlFromText(params.text);
  if (fromText) return fromText;
  if (direct) return direct;
  return "";
}

/** Title from share payload; strip bare URL if that's all we got. */
export function resolveSharedTitle(params: {
  title?: string | null;
  text?: string | null;
  url?: string | null;
}): string {
  const t = params.title?.trim();
  if (t && !/^https?:\/\//i.test(t)) return t;
  const text = params.text?.trim();
  if (text) {
    const withoutUrl = text
      .replace(/https?:\/\/[^\s<>"']+/gi, "")
      .trim();
    if (withoutUrl) return withoutUrl.slice(0, 200);
  }
  if (t) return t;
  try {
    const u = resolveSharedUrl(params);
    if (u) return new URL(u.startsWith("http") ? u : `https://${u}`).hostname;
  } catch {
    /* ignore */
  }
  return "";
}

export function hostnameOf(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(
      /^www\./,
      ""
    );
  } catch {
    return url;
  }
}
