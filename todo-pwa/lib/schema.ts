/** App schema — see agents.md. Never use public. */
export const SUPABASE_SCHEMA = "todo_pwa" as const;

export type Task = {
  id: string;
  title: string;
  notes: string | null;
  is_done: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};
