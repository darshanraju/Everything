"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { SubNav } from "@/components/shell/sub-nav";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Program } from "@/lib/schema";
import { FITNESS_SUBNAV } from "@/modules/fitness/nav";
import {
  createProgram,
  deleteProgram,
  listPrograms,
} from "@/modules/fitness/lib/api";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setPrograms(await listPrograms());
  }

  useEffect(() => {
    void refresh()
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    try {
      const p = await createProgram(name);
      setName("");
      setPrograms((prev) => [...prev, p].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this program?")) return;
    await deleteProgram(id);
    setPrograms((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <AppShell title="Programs" subtitle="Routines with sets & reps">
      <SubNav items={FITNESS_SUBNAV} />

      <form onSubmit={onCreate} className="mb-5 flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New program name (e.g. Push A)"
          className="h-11 flex-1"
        />
        <Button type="submit" className="h-11 rounded-full" disabled={!name.trim()}>
          <Plus /> Create
        </Button>
      </form>
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      {loading ? (
        <p className="text-muted-foreground">
          <Loader2 className="inline size-4 animate-spin" /> Loading…
        </p>
      ) : programs.length === 0 ? (
        <p className="text-muted-foreground">No programs yet. Create one above.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {programs.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-xl border border-border/80 bg-card px-3 py-2"
            >
              <Link
                href={`/fitness/programs/${p.id}`}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "h-auto flex-1 justify-start px-2 py-2 text-left font-semibold"
                )}
              >
                {p.name}
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(p.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
