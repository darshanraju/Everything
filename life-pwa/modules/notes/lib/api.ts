import { db } from "@/lib/supabase/client";
import type { Note } from "@/lib/schema";

function mapNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    title: row.title as string,
    body: (row.body as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listNotes(): Promise<Note[]> {
  const { data, error } = await db()
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapNote(r as Record<string, unknown>));
}

export async function getNote(id: string): Promise<Note | null> {
  const { data, error } = await db()
    .from("notes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapNote(data as Record<string, unknown>);
}

export async function createNote(input: {
  title: string;
  body?: string | null;
}): Promise<Note> {
  const { data, error } = await db()
    .from("notes")
    .insert({
      title: input.title.trim(),
      body: input.body?.trim() || null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapNote(data as Record<string, unknown>);
}

export async function updateNote(
  id: string,
  input: { title: string; body?: string | null }
): Promise<Note> {
  const { data, error } = await db()
    .from("notes")
    .update({
      title: input.title.trim(),
      body: input.body?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapNote(data as Record<string, unknown>);
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await db().from("notes").delete().eq("id", id);
  if (error) throw error;
}
