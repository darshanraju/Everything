"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { deleteTask, toggleTask } from "@/lib/tasks";
import type { Task } from "@/lib/schema";
import { cn } from "@/lib/utils";

type Props = {
  task: Task;
  onChange: (task: Task) => void;
  onDelete: (id: string) => void;
};

export function TaskItem({ task, onChange, onDelete }: Props) {
  const [busy, setBusy] = useState(false);

  async function onToggle(checked: boolean) {
    setBusy(true);
    try {
      const updated = await toggleTask(task.id, checked);
      onChange(updated);
    } catch {
      // keep previous state
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    setBusy(true);
    try {
      await deleteTask(task.id);
      onDelete(task.id);
    } catch {
      setBusy(false);
    }
  }

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3.5",
        task.is_done && "opacity-70"
      )}
    >
      <Checkbox
        checked={task.is_done}
        disabled={busy}
        onCheckedChange={(v) => onToggle(v === true)}
        className="mt-0.5 size-5 rounded-md border-primary/40 data-checked:bg-primary"
        aria-label={task.is_done ? "Mark incomplete" : "Mark complete"}
      />
      <p
        className={cn(
          "min-w-0 flex-1 text-base leading-snug",
          task.is_done && "text-muted-foreground line-through"
        )}
      >
        {task.title}
      </p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
        disabled={busy}
        onClick={onRemove}
        aria-label="Delete task"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
      </Button>
    </li>
  );
}
