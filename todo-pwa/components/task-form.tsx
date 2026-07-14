"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTask } from "@/lib/tasks";
import type { Task } from "@/lib/schema";

type Props = {
  onCreated: (task: Task) => void;
};

export function TaskForm({ onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const task = await createTask(title);
      setTitle("");
      onCreated(task);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What do you need to do?"
          className="h-12 flex-1 rounded-xl border-border bg-card text-base"
          disabled={loading}
          autoComplete="off"
        />
        <Button
          type="submit"
          size="lg"
          className="h-12 shrink-0 rounded-xl px-4 font-semibold"
          disabled={loading || !title.trim()}
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Plus className="size-5" />
              Add
            </>
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
