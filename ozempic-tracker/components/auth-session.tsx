"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Keeps the Supabase session fresh on the client (cookie storage via @supabase/ssr).
 * Replaces Edge middleware session refresh, which crashes on Vercel (__dirname).
 */
export function AuthSession() {
  useEffect(() => {
    const supabase = createClient();

    // Trigger a session read so expired access tokens can refresh.
    void supabase.auth.getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      // Subscription keeps auto-refresh active while the tab is open.
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
