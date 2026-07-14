import { db } from "@/lib/supabase/client";
import type {
  HealthCategory,
  HealthLog,
  HealthProtocol,
} from "@/lib/schema";
import { format, startOfDay, endOfDay } from "date-fns";

function mapWeekdays(raw: unknown): number[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) return null;
  const days = raw
    .map((w) => Number(w))
    .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);
  return days.length ? [...new Set(days)].sort((a, b) => a - b) : null;
}

function mapProtocol(row: Record<string, unknown>): HealthProtocol {
  const cat = row.category as string | undefined;
  const category: HealthCategory =
    cat === "medicine" ||
    cat === "skincare" ||
    cat === "supplement" ||
    cat === "other" ||
    cat === "peptide"
      ? cat
      : "peptide";
  return {
    id: row.id as string,
    name: row.name as string,
    category,
    amount: row.amount != null ? Number(row.amount) : null,
    unit: (row.unit as string) ?? "mcg",
    syringe_units:
      row.syringe_units != null ? Number(row.syringe_units) : null,
    frequency: (row.frequency as string) ?? "daily",
    frequency_note: (row.frequency_note as string) ?? null,
    schedule_weekdays: mapWeekdays(row.schedule_weekdays),
    active: Boolean(row.active),
    notes: (row.notes as string) ?? null,
    created_at: row.created_at as string,
  };
}

export async function listProtocols(
  activeOnly = false
): Promise<HealthProtocol[]> {
  let q = db().from("peptide_protocols").select("*").order("name");
  if (activeOnly) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => mapProtocol(r as Record<string, unknown>));
}

export async function createProtocol(input: {
  name: string;
  category: HealthCategory;
  amount?: number | null;
  unit?: string;
  syringe_units?: number | null;
  frequency: string;
  frequency_note?: string;
  schedule_weekdays?: number[] | null;
  notes?: string;
}): Promise<HealthProtocol> {
  const { data, error } = await db()
    .from("peptide_protocols")
    .insert({
      name: input.name.trim(),
      category: input.category,
      amount: input.amount != null && input.amount > 0 ? input.amount : null,
      unit: input.unit?.trim() || "mcg",
      syringe_units:
        input.category === "peptide" &&
        input.syringe_units != null &&
        input.syringe_units > 0
          ? input.syringe_units
          : null,
      frequency: input.frequency,
      frequency_note: input.frequency_note?.trim() || null,
      schedule_weekdays: input.schedule_weekdays ?? null,
      notes: input.notes?.trim() || null,
      active: true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapProtocol(data as Record<string, unknown>);
}

export async function getProtocol(id: string): Promise<HealthProtocol | null> {
  const { data, error } = await db()
    .from("peptide_protocols")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProtocol(data as Record<string, unknown>) : null;
}

export async function updateProtocol(
  id: string,
  input: {
    name: string;
    category: HealthCategory;
    amount?: number | null;
    unit?: string;
    syringe_units?: number | null;
    frequency: string;
    frequency_note?: string;
    schedule_weekdays?: number[] | null;
    notes?: string;
    active?: boolean;
  }
): Promise<HealthProtocol> {
  const { data, error } = await db()
    .from("peptide_protocols")
    .update({
      name: input.name.trim(),
      category: input.category,
      amount: input.amount != null && input.amount > 0 ? input.amount : null,
      unit: input.unit?.trim() || "mcg",
      syringe_units:
        input.category === "peptide" &&
        input.syringe_units != null &&
        input.syringe_units > 0
          ? input.syringe_units
          : null,
      frequency: input.frequency,
      frequency_note: input.frequency_note?.trim() || null,
      schedule_weekdays: input.schedule_weekdays ?? null,
      notes: input.notes?.trim() || null,
      ...(input.active !== undefined ? { active: input.active } : {}),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapProtocol(data as Record<string, unknown>);
}

export async function setProtocolActive(
  id: string,
  active: boolean
): Promise<void> {
  const { error } = await db()
    .from("peptide_protocols")
    .update({ active })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProtocol(id: string): Promise<void> {
  const { error } = await db().from("peptide_protocols").delete().eq("id", id);
  if (error) throw error;
}

export async function logDose(input: {
  protocol_id: string;
  amount?: number | null;
  notes?: string;
  taken_at?: string;
}): Promise<HealthLog> {
  const { data, error } = await db()
    .from("peptide_logs")
    .insert({
      protocol_id: input.protocol_id,
      amount: input.amount ?? null,
      notes: input.notes?.trim() || null,
      taken_at: input.taken_at ?? new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as HealthLog;
}

export async function listRecentLogs(limit = 40): Promise<HealthLog[]> {
  const { data, error } = await db()
    .from("peptide_logs")
    .select("*, protocol:peptide_protocols(*)")
    .order("taken_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as HealthLog & {
      protocol: Record<string, unknown> | Record<string, unknown>[];
    };
    const protoRaw = Array.isArray(r.protocol) ? r.protocol[0] : r.protocol;
    return {
      id: r.id,
      protocol_id: r.protocol_id,
      taken_at: r.taken_at,
      amount: r.amount != null ? Number(r.amount) : null,
      notes: r.notes,
      protocol: protoRaw
        ? mapProtocol(protoRaw as Record<string, unknown>)
        : undefined,
    };
  });
}

export async function logsTodayForProtocol(
  protocolId: string
): Promise<HealthLog[]> {
  const start = startOfDay(new Date()).toISOString();
  const end = endOfDay(new Date()).toISOString();
  const { data, error } = await db()
    .from("peptide_logs")
    .select("*")
    .eq("protocol_id", protocolId)
    .gte("taken_at", start)
    .lte("taken_at", end);
  if (error) throw error;
  return (data ?? []) as HealthLog[];
}

export function todayKey(): string {
  return format(new Date(), "yyyy-MM-dd");
}
