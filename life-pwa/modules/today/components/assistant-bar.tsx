"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, MicOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  sendAssistantCommand,
  transcribeAudio,
} from "@/modules/assistant/client";
import type { NeedsConfirm } from "@/modules/assistant/types";

const MAX_RECORD_MS = 15_000;

function pickRecorderMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

/** Right Option (⌥) — reliable push-to-talk on Mac in browsers. */
function isPushToTalkKey(e: KeyboardEvent): boolean {
  return e.code === "AltRight";
}

export function AssistantBar({
  onApplied,
}: {
  onApplied: () => void | Promise<void>;
}) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState<NeedsConfirm | null>(null);
  const [micReady, setMicReady] = useState(false);
  const [holdHint, setHoldHint] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);
  const listeningRef = useRef(false);
  const startingRef = useRef(false);
  /** Which PTT key is held (code), so we only stop on matching keyup */
  const heldKeyRef = useRef<string | null>(null);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);
  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  useEffect(() => {
    setMicReady(
      typeof window !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined"
    );
  }, []);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTracks(), [stopTracks]);

  const runCommand = useCallback(
    async (input: { text?: string; confirmItemId?: string }) => {
      setBusy(true);
      setError(null);
      setReply(null);
      try {
        const result = await sendAssistantCommand(input);
        if (result.needsConfirm) {
          setNeedsConfirm(result.needsConfirm);
          setReply(result.reply);
        } else {
          setNeedsConfirm(null);
          setReply(result.reply);
          await onApplied();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Command failed");
      } finally {
        setBusy(false);
      }
    },
    [onApplied]
  );

  const finishRecording = useCallback(
    async (rec: MediaRecorder) => {
      setListening(false);
      listeningRef.current = false;
      heldKeyRef.current = null;
      setHoldHint(null);
      const mime = rec.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mime });
      chunksRef.current = [];
      mediaRecorderRef.current = null;
      stopTracks();

      if (blob.size < 500) {
        setError("Recording too short — hold longer, then release.");
        return;
      }

      setBusy(true);
      setError(null);
      try {
        const transcript = await transcribeAudio(blob);
        setText(transcript);
        await runCommand({ text: transcript });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not transcribe");
        setBusy(false);
      }
    },
    [runCommand, stopTracks]
  );

  const stopRecording = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      rec.stop();
    } else {
      setListening(false);
      listeningRef.current = false;
      heldKeyRef.current = null;
      setHoldHint(null);
      stopTracks();
    }
  }, [stopTracks]);

  const startRecording = useCallback(
    async (source: "option" | "click") => {
      if (busyRef.current || listeningRef.current || startingRef.current) {
        return;
      }
      if (!micReady) {
        setError("Microphone not supported in this browser — type instead.");
        return;
      }

      startingRef.current = true;
      setError(null);
      setReply(null);
      setHoldHint(
        source === "option"
          ? "Holding right ⌥… release to send"
          : "Listening… click mic again when done"
      );

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        // User released before permission granted
        if (!startingRef.current && !heldKeyRef.current && source !== "click") {
          stream.getTracks().forEach((t) => t.stop());
          startingRef.current = false;
          setHoldHint(null);
          return;
        }

        streamRef.current = stream;
        const mime = pickRecorderMime();
        const rec = mime
          ? new MediaRecorder(stream, { mimeType: mime })
          : new MediaRecorder(stream);

        chunksRef.current = [];
        rec.ondataavailable = (ev) => {
          if (ev.data.size > 0) chunksRef.current.push(ev.data);
        };
        rec.onerror = () => {
          setListening(false);
          listeningRef.current = false;
          stopTracks();
          setError("Recording failed — try typing instead.");
        };
        rec.onstop = () => {
          void finishRecording(rec);
        };

        mediaRecorderRef.current = rec;
        rec.start(250);
        setListening(true);
        listeningRef.current = true;

        maxTimerRef.current = setTimeout(() => {
          if (mediaRecorderRef.current?.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        }, MAX_RECORD_MS);
      } catch (e) {
        stopTracks();
        setListening(false);
        listeningRef.current = false;
        heldKeyRef.current = null;
        setHoldHint(null);
        const msg = e instanceof Error ? e.message : "Mic blocked";
        if (/Permission|NotAllowed|denied/i.test(msg)) {
          setError(
            "Microphone permission denied — allow mic for this site, or type."
          );
        } else {
          setError(`Mic: ${msg}`);
        }
      } finally {
        startingRef.current = false;
      }
    },
    [finishRecording, micReady, stopTracks]
  );

  // Hold right Option (⌥) for push-to-talk
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isPushToTalkKey(e)) return;
      if (e.repeat) return;
      e.preventDefault();
      heldKeyRef.current = e.code;
      void startRecording("option");
    }

    function onKeyUp(e: KeyboardEvent) {
      if (!isPushToTalkKey(e)) return;
      if (heldKeyRef.current === e.code || listeningRef.current) {
        e.preventDefault();
        heldKeyRef.current = null;
        // Cancel if still starting (user released during permission prompt)
        if (startingRef.current && !listeningRef.current) {
          startingRef.current = false;
          stopTracks();
          setHoldHint(null);
          return;
        }
        stopRecording();
      }
    }

    function onBlur() {
      if (listeningRef.current || heldKeyRef.current) {
        heldKeyRef.current = null;
        stopRecording();
      }
    }

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", onBlur);
    };
  }, [startRecording, stopRecording, stopTracks]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    setText("");
    await runCommand({ text: t });
  }

  function toggleMicClick() {
    if (busy && !listening) return;
    if (listening) {
      stopRecording();
      return;
    }
    void startRecording("click");
  }

  return (
    <div className="mb-3 shrink-0 space-y-2 rounded-xl border border-border/70 bg-card/50 p-2.5">
      <form onSubmit={onSubmit} className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Ask Life… or hold right ⌥ and speak'
          className="h-10 flex-1"
          disabled={busy}
        />
        <Button
          type="button"
          size="icon"
          variant={listening ? "default" : "outline"}
          className={cn(
            "h-10 w-10 shrink-0 rounded-full",
            listening && "animate-pulse"
          )}
          disabled={busy && !listening}
          onClick={toggleMicClick}
          aria-label={listening ? "Stop recording" : "Record voice"}
          title="Click mic, or hold right ⌥ to talk"
        >
          {listening ? (
            <MicOff className="size-4" />
          ) : busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Mic className="size-4" />
          )}
        </Button>
        <Button
          type="submit"
          className="h-10 shrink-0 rounded-full"
          disabled={busy || !text.trim()}
        >
          {busy && !listening ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </form>

      {(listening || holdHint) && (
        <p className="text-[11px] text-primary">
          {holdHint ?? "Listening… release key or click mic to send (max 15s)."}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground">
        Push-to-talk: hold right{" "}
        <kbd className="rounded border border-border px-1">⌥ Option</kbd>,
        speak, release. Mic click still works.
      </p>

      {needsConfirm && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-sm">
          <span className="min-w-0 flex-1">
            Mark <strong>{needsConfirm.title}</strong> done?
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              {needsConfirm.reason}
            </span>
          </span>
          <Button
            size="sm"
            className="rounded-full"
            disabled={busy}
            onClick={() =>
              void runCommand({ confirmItemId: needsConfirm.itemId })
            }
          >
            Yes
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={() => {
              setNeedsConfirm(null);
              setReply(null);
            }}
          >
            No
          </Button>
        </div>
      )}

      {reply && !needsConfirm && (
        <p className="text-xs text-muted-foreground">{reply}</p>
      )}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
