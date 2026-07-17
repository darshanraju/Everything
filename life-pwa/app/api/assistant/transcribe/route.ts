export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Proxy audio → xAI Speech-to-Text (POST https://api.x.ai/v1/stt).
 * Keeps XAI_API_KEY server-side.
 */
export async function POST(request: Request) {
  const key = process.env.XAI_API_KEY?.trim();
  if (!key) {
    return Response.json(
      { error: "XAI_API_KEY is not set" },
      { status: 500 }
    );
  }

  let formIn: FormData;
  try {
    formIn = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart form" }, { status: 400 });
  }

  const file = formIn.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return Response.json({ error: "Missing audio file" }, { status: 400 });
  }
  if (file.size > 12 * 1024 * 1024) {
    return Response.json({ error: "Audio too large" }, { status: 413 });
  }

  const filename =
    file instanceof File && file.name
      ? file.name
      : `recording.${guessExt(file.type)}`;

  // xAI requires `file` last among multipart fields
  const out = new FormData();
  out.append("language", "en");
  out.append("format", "true");
  out.append("keyterm", "todo");
  out.append("keyterm", "stack");
  out.append("keyterm", "Today");
  out.append("file", file, filename);

  try {
    const res = await fetch("https://api.x.ai/v1/stt", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: out,
      cache: "no-store",
    });
    const raw = await res.text();
    if (!res.ok) {
      console.error("[api/assistant/transcribe]", res.status, raw.slice(0, 300));
      return Response.json(
        {
          error: `Speech-to-text failed (${res.status}): ${raw.slice(0, 160)}`,
        },
        { status: 502 }
      );
    }
    let json: { text?: string };
    try {
      json = JSON.parse(raw) as { text?: string };
    } catch {
      return Response.json(
        { error: "Invalid STT response" },
        { status: 502 }
      );
    }
    const text = (json.text ?? "").trim();
    if (!text) {
      return Response.json(
        { error: "No speech detected — try again" },
        { status: 400 }
      );
    }
    return Response.json({ text });
  } catch (e) {
    console.error("[api/assistant/transcribe]", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Transcribe failed" },
      { status: 500 }
    );
  }
}

function guessExt(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  return "webm";
}
