/** OpenAI-compatible tool definitions for Grok function calling. */

export const ASSISTANT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "list_pending",
      description:
        "List today's pending (not done) items. Use when the user asks what's left.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_today_todo",
      description:
        "Add a new personal todo to Today's Yours list. Use for new tasks like check email, buy milk, etc. If the user mentions a URL, put it in link.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Short todo title",
          },
          link: {
            type: "string",
            description: "Optional URL to open with the todo",
          },
          notes: {
            type: "string",
            description:
              "Optional notes or link (prefer link field for URLs)",
          },
        },
        required: ["title"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "complete_today_item",
      description:
        "Mark an existing Today item done (todo, health protocol, food, etc.). Prefer item_id from the catalog. If unsure of id, pass query with words from the title (e.g. morning stack).",
      parameters: {
        type: "object",
        properties: {
          item_id: {
            type: "string",
            description: "Exact catalog item id when known",
          },
          query: {
            type: "string",
            description:
              "Fuzzy match against pending item titles if item_id unknown",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "uncomplete_today_item",
      description:
        "Mark a completed toggleable item as not done again. Requires exact item_id.",
      parameters: {
        type: "object",
        properties: {
          item_id: {
            type: "string",
            description: "Exact catalog item id",
          },
        },
        required: ["item_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "reschedule_today_todo",
      description:
        "Push a manual Yours todo from today to a future day so it reappears then. Only works for source=manual pending todos.",
      parameters: {
        type: "object",
        properties: {
          item_id: {
            type: "string",
            description: "Exact catalog id (manual:task:…)",
          },
          query: {
            type: "string",
            description: "Match by title if item_id unknown",
          },
          due_on: {
            type: "string",
            description: "Future date yyyy-MM-dd",
          },
          days_ahead: {
            type: "number",
            description:
              "Alternative to due_on: 1 = tomorrow, 3 = in 3 days, 7 = next week",
          },
        },
        additionalProperties: false,
      },
    },
  },
];

export const SYSTEM_PROMPT = `You are Life's Today assistant. The user speaks or types short commands about their day.

You may ONLY use the provided tools to change data. Prefer tool calls over long chat.

Rules:
- To add a new task, call add_today_todo with a concise title.
- To check something off, call complete_today_item with item_id from the catalog when possible.
- To push a todo later, call reschedule_today_todo (days_ahead=1 for tomorrow).
- If the user refers to something by name, pass query= that name (or use the matching id).
- For "what's left" use list_pending.
- Do not invent item ids. Only use ids from the catalog.
- If nothing matches and they want to complete something, say so in your final message after tools.
- Keep final assistant text short (1–2 sentences) describing what you did.

Today's catalog (live):
`;
