"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  armRestNotification,
  cancelRestNotification,
  ensureRestNotificationPermission,
  notifyRestDoneForeground,
} from "@/modules/fitness/lib/rest-notifications";

const STORAGE_KEY = "life_rest_seconds";
const DEFAULT_SECONDS = 90;
const PRESETS = [60, 90, 120, 180] as const;

function readPref(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SECONDS;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 5 || n > 600) return DEFAULT_SECONDS;
    return Math.round(n);
  } catch {
    return DEFAULT_SECONDS;
  }
}

function writePref(seconds: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(seconds));
  } catch {
    /* ignore */
  }
}

function formatMmSs(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function vibrateDone() {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  } catch {
    /* ignore */
  }
}

function beepDone() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    o.stop(ctx.currentTime + 0.35);
    void ctx.close();
  } catch {
    /* ignore */
  }
}

export type RestTimerApi = {
  secondsPref: number;
  setSecondsPref: (n: number) => void;
  remaining: number;
  duration: number;
  isRunning: boolean;
  justDone: boolean;
  start: () => void;
  skip: () => void;
  add: (seconds: number) => void;
};

export function useRestTimer(): RestTimerApi {
  const [secondsPref, setSecondsPrefState] = useState(DEFAULT_SECONDS);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [duration, setDuration] = useState(DEFAULT_SECONDS);
  const [remaining, setRemaining] = useState(0);
  const [justDone, setJustDone] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const durationRef = useRef(DEFAULT_SECONDS);
  const firedEndsAtRef = useRef<number | null>(null);

  useEffect(() => {
    setSecondsPrefState(readPref());
  }, []);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    if (endsAt == null && !justDone) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [endsAt, justDone]);

  // Catch up when returning from background (tab may have been throttled)
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") {
        setNow(Date.now());
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    if (endsAt == null) return;
    const left = Math.max(0, (endsAt - now) / 1000);
    setRemaining(left);
    if (left <= 0) {
      const finishedEndsAt = endsAt;
      setEndsAt(null);
      setRemaining(0);
      setJustDone(true);
      // Cancel SW timer so we don't double-notify when the page is in the foreground
      cancelRestNotification();
      if (firedEndsAtRef.current !== finishedEndsAt) {
        firedEndsAtRef.current = finishedEndsAt;
        vibrateDone();
        beepDone();
        // If we were backgrounded, the SW may already have notified; tag replaces it.
        // If SW never ran (dev / no SW), still show a system notification when possible.
        if (document.visibilityState !== "visible") {
          notifyRestDoneForeground(durationRef.current);
        }
      }
    }
  }, [endsAt, now]);

  useEffect(() => {
    if (!justDone) return;
    const t = window.setTimeout(() => setJustDone(false), 1800);
    return () => clearTimeout(t);
  }, [justDone]);

  const setSecondsPref = useCallback((n: number) => {
    const v = Math.min(600, Math.max(5, Math.round(n)));
    setSecondsPrefState(v);
    writePref(v);
  }, []);

  const start = useCallback(() => {
    const sec = readPref();
    const end = Date.now() + sec * 1000;
    setSecondsPrefState(sec);
    setDuration(sec);
    durationRef.current = sec;
    setJustDone(false);
    firedEndsAtRef.current = null;
    setEndsAt(end);
    setRemaining(sec);
    void ensureRestNotificationPermission().then((ok) => {
      if (ok) armRestNotification(end, { durationSec: sec });
    });
  }, []);

  const skip = useCallback(() => {
    cancelRestNotification();
    setEndsAt(null);
    setRemaining(0);
    setJustDone(false);
    firedEndsAtRef.current = null;
  }, []);

  const add = useCallback((seconds: number) => {
    setEndsAt((prev) => {
      if (prev == null) return prev;
      const next = prev + seconds * 1000;
      setDuration((d) => {
        const nd = d + seconds;
        durationRef.current = nd;
        armRestNotification(next, { durationSec: nd });
        return nd;
      });
      return next;
    });
  }, []);

  return {
    secondsPref,
    setSecondsPref,
    remaining,
    duration,
    isRunning: endsAt != null,
    justDone,
    start,
    skip,
    add,
  };
}

export function RestTimerSettingsButton({
  secondsPref,
  setSecondsPref,
}: {
  secondsPref: number;
  setSecondsPref: (n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(String(secondsPref));

  useEffect(() => {
    setCustom(String(secondsPref));
  }, [secondsPref, open]);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="rounded-full gap-1 tabular-nums"
        onClick={() => setOpen(true)}
      >
        <Timer className="size-3.5" />
        Rest {secondsPref}s
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rest-settings-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-t-2xl border border-border/80 bg-card p-5 shadow-xl sm:m-4 sm:rounded-2xl">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h2
                  id="rest-settings-title"
                  className="text-lg font-bold tracking-tight"
                >
                  Rest duration
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Starts when you tick a set complete. Allow notifications so
                  rest still alerts when the app is in the background (installed
                  PWA / production).
                </p>
              </div>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="rounded-full"
                onClick={() => setOpen(false)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setSecondsPref(p);
                    setOpen(false);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
                    secondsPref === p
                      ? "border-primary/40 bg-primary/20 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {p}s
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="rest-custom">Custom (seconds)</Label>
                <Input
                  id="rest-custom"
                  type="number"
                  min={5}
                  max={600}
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button
                type="button"
                className="h-11 rounded-full"
                onClick={() => {
                  const n = Number(custom);
                  if (!Number.isFinite(n)) return;
                  setSecondsPref(n);
                  setOpen(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function RestTimerBar({ timer }: { timer: RestTimerApi }) {
  const { isRunning, justDone, remaining, duration, skip, add } = timer;

  if (!isRunning && !justDone) return null;

  const progress =
    duration > 0 && isRunning
      ? Math.min(1, Math.max(0, remaining / duration))
      : justDone
        ? 0
        : 1;

  return (
    <div
      className={cn(
        "fixed inset-x-0 z-30 border-t border-border/80 bg-card/95 px-4 py-3 backdrop-blur-md",
        "bottom-[calc(3.75rem+env(safe-area-inset-bottom))]"
      )}
    >
      <div className="mx-auto flex max-w-lg flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {justDone ? "Rest done" : "Rest"}
            </p>
            <p
              className={cn(
                "text-3xl font-bold tabular-nums tracking-tight",
                justDone ? "text-primary" : "text-foreground"
              )}
            >
              {justDone ? "0:00" : formatMmSs(remaining)}
            </p>
          </div>
          {!justDone && (
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => add(15)}
              >
                +15s
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="rounded-full"
                onClick={skip}
              >
                Skip
              </Button>
            </div>
          )}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-200",
              justDone ? "bg-primary" : "bg-sky-400"
            )}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
