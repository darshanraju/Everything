"use client";

import { TaskItem } from "@/components/task-item";
import type { Task } from "@/lib/schema";

type Props = {
  tasks: Task[];
  onChange: (task: Task) => void;
  onDelete: (id: string) => void;
};

export function TaskList({ tasks, onChange, onDelete }: Props) {
  const open = tasks.filter((t) => !t.is_done);
  const done = tasks.filter((t) => t.is_done);

  if (tasks.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-muted-foreground">
        No tasks yet. Add one above.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h2 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
          Open ({open.length})
        </h2>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">All caught up ✨</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {open.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onChange={onChange}
                onDelete={onDelete}
              />
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Done ({done.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {done.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onChange={onChange}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
