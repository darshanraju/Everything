import type { AssistantCommandResult } from "@/modules/assistant/types";

export async function sendAssistantCommand(input: {
  text?: string;
  confirmItemId?: string;
}): Promise<AssistantCommandResult> {
  const res = await fetch("/api/assistant/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = (await res.json()) as AssistantCommandResult & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(json.error ?? `Assistant failed (${res.status})`);
  }
  return json;
}

/** Upload recorded audio → xAI STT via our server. */
export async function transcribeAudio(blob: Blob): Promise<string> {
  const form = new FormData();
  const ext = blob.type.includes("ogg")
    ? "ogg"
    : blob.type.includes("mp4")
      ? "m4a"
      : "webm";
  form.append("file", blob, `recording.${ext}`);
  const res = await fetch("/api/assistant/transcribe", {
    method: "POST",
    body: form,
  });
  const json = (await res.json()) as { text?: string; error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? `Transcribe failed (${res.status})`);
  }
  if (!json.text?.trim()) {
    throw new Error("No speech detected");
  }
  return json.text.trim();
}

