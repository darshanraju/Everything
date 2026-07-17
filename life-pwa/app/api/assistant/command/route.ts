import { loadTodayCatalog } from "@/modules/assistant/catalog";
import { confirmCompleteItem } from "@/modules/assistant/execute";
import { runAssistantCommand } from "@/modules/assistant/xai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { text?: string; confirmItemId?: string };
  try {
    body = (await request.json()) as {
      text?: string;
      confirmItemId?: string;
    };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const confirmItemId = body.confirmItemId?.trim();
  const text = body.text?.trim() ?? "";

  if (!confirmItemId && !text) {
    return Response.json(
      { error: "Provide text or confirmItemId" },
      { status: 400 }
    );
  }
  if (text.length > 500) {
    return Response.json({ error: "Text too long" }, { status: 400 });
  }

  try {
    const { sections, catalog } = await loadTodayCatalog(new Date());

    if (confirmItemId) {
      const result = await confirmCompleteItem(confirmItemId, sections);
      const ok = result.actions.some((a) => a.ok);
      return Response.json({
        reply: ok
          ? `Marked “${result.actions[0]?.title ?? "item"}” done.`
          : result.actions[0]?.message ?? "Could not complete.",
        actions: result.actions,
      });
    }

    const result = await runAssistantCommand(text, sections, catalog);
    return Response.json(result);
  } catch (e) {
    console.error("[api/assistant/command]", e);
    return Response.json(
      {
        error: e instanceof Error ? e.message : "Assistant failed",
      },
      { status: 500 }
    );
  }
}
