"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Personal light gate — not true auth (client-side). */
const PASSCODE = "9605";
const STORAGE_KEY = "life_passcode_ok";

export function PasscodeGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        setUnlocked(localStorage.getItem(STORAGE_KEY) === "1");
      }
    } catch {
      /* private mode etc. */
    }
    setReady(true);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim() === PASSCODE) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      setUnlocked(true);
      setError(null);
      setValue("");
      return;
    }
    setError("Incorrect passcode");
    setValue("");
  }

  if (!ready) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-card p-6 shadow-lg">
        <p className="text-center text-sm font-bold tracking-tight text-primary">
          Life
        </p>
        <h1 className="mt-2 text-center text-xl font-bold tracking-tight">
          Enter passcode
        </h1>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Required to open this app on this device
        </p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="passcode" className="sr-only">
              Passcode
            </Label>
            <Input
              id="passcode"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={8}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder="••••"
              className="h-12 text-center text-lg tracking-[0.4em]"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-center text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            className="h-11 w-full rounded-full"
            disabled={!value.trim()}
          >
            Unlock
          </Button>
        </form>
      </div>
    </div>
  );
}
