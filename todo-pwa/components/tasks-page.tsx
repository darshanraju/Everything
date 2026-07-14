"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { TaskForm } from "@/components/task-form";
import { TaskList } from "@/components/task-list";
import { InstallPrompt } from "@/components/install-prompt";
import { listTasks } from "@/lib/tasks";
import type { Task } from "@/lib/schema";

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await listTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load tasks. Check Supabase schema `todo_pwa` is exposed."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function onCreated(task: Task) {
    setTasks((prev) => [task, ...prev]);
  }

  function onChange(task: Task) {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
  }

  function onDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <>
      <AppNav />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-6 pb-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add tasks and check them off as you go.
          </p>
        </div>

        <TaskForm onCreated={onCreated} />
        <InstallPrompt />

        {loading ? (
          <p className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Loading…
          </p>
        ) : error ? (
          <p
            className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : (
          <TaskList tasks={tasks} onChange={onChange} onDelete={onDelete} />
        )}
      </main>
    </>
  );
}
