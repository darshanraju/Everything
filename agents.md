# Agents.md - Database Schema Strategy for Multi-App Projects

## Overview
We use **one shared Supabase PostgreSQL database** for all personal and side projects.  
Each app/project gets its own **PostgreSQL schema** (namespace) to keep tables cleanly separated while sharing the same database connection, auth, storage, and edge functions.

This prevents table name collisions and makes organization much easier as the number of vibe-coded apps grows.

## Core Rules

- **Never** create a new Supabase project per app.
- **Never** dump everything into the `public` schema.
- **Always** create a dedicated schema named after the project/app (lowercase, snake_case preferred).
- Shared data (users, preferences, cross-app features) lives in the `public` or a dedicated `shared` schema.

## Schema Naming Convention
- Use the project/app name in lowercase with underscores:  
  Examples: `todo_pwa`, `superfluid`, `canvas_me`, `personal_tools`, `vibe_coding_hub`
- Keep it short and descriptive.

## When to Create a New Schema
Create a new schema at the **start of every new app/project**, right after initializing the repo.

**Prompt you can give Grok / Grok Build:**

```
Start a new app called [App Name]. 

Use my existing Supabase project [Project Name or URL]. 
Create a dedicated PostgreSQL schema named [schema_name] for all app-specific tables. 
Do not use the public schema. 
Follow the schema strategy in agents.md.
Set up the initial tables and Supabase client configuration accordingly.
```

## How to Create a Schema

### 1. SQL (Run once via Supabase Dashboard or Migration)
```sql
-- Create the schema
CREATE SCHEMA IF NOT EXISTS todo_pwa;

-- Optional: Grant usage to authenticated users
GRANT USAGE ON SCHEMA todo_pwa TO authenticated, anon;
```

### 2. In Your Code (TypeScript / Supabase Client)
```ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Query example
const { data, error } = await supabase
  .schema('todo_pwa')        // ← This is the key line
  .from('tasks')
  .select('*');
```

## Table Creation Inside Schemas

- Always specify the schema when creating tables.
- Example migration / initial setup:

```sql
CREATE TABLE todo_pwa.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE todo_pwa.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON todo_pwa.tasks
  FOR SELECT USING (auth.uid() = user_id);
```

## How to Know Which Schema Your Current Project Uses

1. Check `agents.md` or project README.
2. Look for `.env` or `supabase/config.toml` — document the schema name there.
3. Add this to every project's root `README.md`:

   ```markdown
   ## Database
   - Supabase Project: [Name]
   - Schema: `todo_pwa`
   ```

4. (Optional) Create a small constants file:
   ```ts
   export const SUPABASE_SCHEMA = 'todo_pwa' as const;
   ```

## Best Practices

- **Shared Tables**: Put truly shared data (e.g. user profiles, global settings) in `public` or `shared` schema.
- **RLS Policies**: Define them per schema for better security isolation.
- **Migrations**: Use Supabase migrations or a simple SQL folder per project.
- **Documentation**: Always update this `agents.md` when you change the strategy.
- **Grok Instructions**: Always reference this file in new project prompts so the agent follows the pattern consistently.

## Reusable Grok Prompt Template

```
Follow the database strategy in agents.md.

Build [App Name] with React + TypeScript + Tailwind + shadcn/ui.
Use existing Supabase project.
Create and use schema: [schema_name]
Include initial tables, RLS, and client helpers.
```

Last Updated: July 13, 2026
```

---

**File created successfully.** You can now read or edit it anytime. 

Would you like me to adjust anything in it before you start using it? Or shall we create your next app using this new standard?
