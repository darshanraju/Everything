"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { buttonVariants } from "@/components/ui/button";
import type { Note } from "@/lib/schema";
import { NoteForm } from "@/modules/notes/components/note-form";
import {
  deleteNote,
  getNote,
  updateNote,
} from "@/modules/notes/lib/api";

export default function EditNotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getNote(id)
      .then((n) => {
        if (!n) setError("Note not found");
        setNote(n);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppShell title="Edit note">
        <p className="text-muted-foreground">
          <Loader2 className="inline size-4 animate-spin" /> Loading…
        </p>
      </AppShell>
    );
  }

  if (!note) {
    return (
      <AppShell title="Edit note">
        <p className="text-destructive">{error ?? "Not found"}</p>
        <Link href="/notes" className={buttonVariants({ className: "mt-3" })}>
          Back
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit note" subtitle={note.title}>
      {error && (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <NoteForm
        key={note.id}
        initial={note}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          await updateNote(note.id, {
            title: values.title,
            body: values.body || null,
          });
          router.push("/notes");
        }}
        onDelete={async () => {
          await deleteNote(note.id);
          router.push("/notes");
        }}
      />
    </AppShell>
  );
}
