import { db } from "@/lib/supabase/client";
import type { Surgery, SurgeryStatus } from "@/lib/schema";

const STATUSES: SurgeryStatus[] = [
  "new",
  "consulting",
  "price_found",
  "booked",
  "completed",
];

function mapStatus(raw: string | undefined): SurgeryStatus {
  if (raw && (STATUSES as string[]).includes(raw)) {
    return raw as SurgeryStatus;
  }
  return "new";
}

function mapSurgery(row: Record<string, unknown>): Surgery {
  return {
    id: row.id as string,
    title: row.title as string,
    location: (row.location as string) ?? null,
    notes: (row.notes as string) ?? null,
    status: mapStatus(row.status as string | undefined),
    cost: row.cost != null ? Number(row.cost) : null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export type SurgeryInput = {
  title: string;
  location?: string | null;
  notes?: string | null;
  status: SurgeryStatus;
  cost?: number | null;
};

export async function listSurgeries(): Promise<Surgery[]> {
  const { data, error } = await db()
    .from("surgeries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapSurgery(r as Record<string, unknown>));
}

export async function getSurgery(id: string): Promise<Surgery | null> {
  const { data, error } = await db()
    .from("surgeries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapSurgery(data as Record<string, unknown>);
}

export async function createSurgery(input: SurgeryInput): Promise<Surgery> {
  const { data, error } = await db()
    .from("surgeries")
    .insert({
      title: input.title.trim(),
      location: input.location?.trim() || null,
      notes: input.notes?.trim() || null,
      status: input.status,
      cost:
        input.cost != null && !Number.isNaN(input.cost) ? input.cost : null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapSurgery(data as Record<string, unknown>);
}

export async function updateSurgery(
  id: string,
  input: SurgeryInput
): Promise<Surgery> {
  const { data, error } = await db()
    .from("surgeries")
    .update({
      title: input.title.trim(),
      location: input.location?.trim() || null,
      notes: input.notes?.trim() || null,
      status: input.status,
      cost:
        input.cost != null && !Number.isNaN(input.cost) ? input.cost : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapSurgery(data as Record<string, unknown>);
}

export async function deleteSurgery(id: string): Promise<void> {
  const { error } = await db().from("surgeries").delete().eq("id", id);
  if (error) throw error;
}
