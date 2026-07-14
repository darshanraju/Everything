import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_SCHEMA } from "@/lib/schema";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  }
  return createSupabaseClient(url, key);
}

export function db() {
  return createClient().schema(SUPABASE_SCHEMA);
}
