"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { NoteForm } from "@/modules/notes/components/note-form";
import { createNote } from "@/modules/notes/lib/api";

export default function NewNotePage() {
  const router = useRouter();

  return (
    <AppShell title="New note" subtitle="Feature idea or scratchpad">
      <NoteForm
        submitLabel="Save note"
        onSubmit={async (values) => {
          await createNote({
            title: values.title,
            body: values.body || null,
          });
          router.push("/notes");
        }}
      />
    </AppShell>
  );
}
