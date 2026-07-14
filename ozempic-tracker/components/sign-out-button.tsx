"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={signOut}
      className="h-9 gap-1.5 rounded-full px-3 text-muted-foreground hover:bg-soft-rose hover:text-primary"
    >
      <LogOut className="size-3.5" />
      <span className="sr-only sm:not-sr-only">Sign out</span>
    </Button>
  );
}
