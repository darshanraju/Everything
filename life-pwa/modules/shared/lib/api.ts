import { db } from "@/lib/supabase/client";
import type { SharedLink } from "@/lib/schema";

function mapLink(row: Record<string, unknown>): SharedLink {
  return {
    id: row.id as string,
    url: row.url as string,
    title: row.title as string,
    tag: (row.tag as string) || "other",
    share_text: (row.share_text as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listSharedLinks(tag?: string | null): Promise<SharedLink[]> {
  let q = db()
    .from("shared_links")
    .select("*")
    .order("created_at", { ascending: false });
  if (tag && tag !== "all") {
    q = q.eq("tag", tag);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => mapLink(r as Record<string, unknown>));
}

export async function createSharedLink(input: {
  url: string;
  title: string;
  tag: string;
  share_text?: string | null;
}): Promise<SharedLink> {
  const { data, error } = await db()
    .from("shared_links")
    .insert({
      url: input.url.trim(),
      title: input.title.trim(),
      tag: input.tag.trim() || "other",
      share_text: input.share_text?.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapLink(data as Record<string, unknown>);
}

export async function updateSharedLink(
  id: string,
  input: {
    url: string;
    title: string;
    tag: string;
  }
): Promise<SharedLink> {
  const { data, error } = await db()
    .from("shared_links")
    .update({
      url: input.url.trim(),
      title: input.title.trim(),
      tag: input.tag.trim() || "other",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapLink(data as Record<string, unknown>);
}

export async function deleteSharedLink(id: string): Promise<void> {
  const { error } = await db().from("shared_links").delete().eq("id", id);
  if (error) throw error;
}
