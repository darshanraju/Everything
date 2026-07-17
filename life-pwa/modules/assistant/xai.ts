import { ASSISTANT_TOOLS, SYSTEM_PROMPT } from "@/modules/assistant/tools";
import { executeTool } from "@/modules/assistant/execute";
import { formatCatalogForPrompt } from "@/modules/assistant/catalog";
import type {
  AssistantAction,
  AssistantCommandResult,
  CatalogItem,
  NeedsConfirm,
} from "@/modules/assistant/types";
import type { TodaySection } from "@/modules/today/types";

const XAI_URL = "https://api.x.ai/v1/chat/completions";
const MODEL = process.env.XAI_MODEL?.trim() || "grok-4.5";
const MAX_ROUNDS = 4;

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};

type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

function getApiKey(): string {
  const key = process.env.XAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "XAI_API_KEY is not set. Add it to .env.local / Vercel env."
    );
  }
  return key;
}

async function chatCompletion(messages: ChatMessage[]): Promise<{
  message: ChatMessage;
  finish_reason?: string;
}> {
  const res = await fetch(XAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: ASSISTANT_TOOLS,
      tool_choice: "auto",
      temperature: 0.2,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `xAI error ${res.status}: ${body.slice(0, 300) || res.statusText}`
    );
  }

  const json = (await res.json()) as {
    choices?: Array<{
      message?: ChatMessage;
      finish_reason?: string;
    }>;
  };
  const choice = json.choices?.[0];
  if (!choice?.message) {
    throw new Error("xAI returned empty choices");
  }
  return { message: choice.message, finish_reason: choice.finish_reason };
}

function parseArgs(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Run one user command through Grok tool-calling against Today's catalog.
 */
export async function runAssistantCommand(
  text: string,
  sections: TodaySection[],
  catalog: CatalogItem[]
): Promise<AssistantCommandResult> {
  const system =
    SYSTEM_PROMPT + formatCatalogForPrompt(catalog);

  const messages: ChatMessage[] = [
    { role: "system", content: system },
    { role: "user", content: text.trim() },
  ];

  const actions: AssistantAction[] = [];
  let needsConfirm: NeedsConfirm | undefined;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const { message } = await chatCompletion(messages);
    const toolCalls = message.tool_calls;

    if (!toolCalls?.length) {
      const reply =
        (message.content ?? "").trim() ||
        (actions.length
          ? actions.map((a) => a.title).join("; ")
          : "Done.");
      return { reply, actions, needsConfirm };
    }

    messages.push({
      role: "assistant",
      content: message.content,
      tool_calls: toolCalls,
    });

    for (const tc of toolCalls) {
      const name = tc.function.name;
      const args = parseArgs(tc.function.arguments);
      const result = await executeTool(name, args, { sections, catalog });
      actions.push(...result.actions);
      if (result.needsConfirm) {
        needsConfirm = result.needsConfirm;
      }
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: result.content,
      });
      if (result.stop) {
        return {
          reply: needsConfirm
            ? `Did you mean “${needsConfirm.title}”? Confirm to mark it done.`
            : "Need confirmation.",
          actions,
          needsConfirm,
        };
      }
    }
  }

  return {
    reply: actions.length
      ? `Updated ${actions.filter((a) => a.ok).length} thing(s).`
      : "Stopped after too many tool steps.",
    actions,
    needsConfirm,
  };
}
