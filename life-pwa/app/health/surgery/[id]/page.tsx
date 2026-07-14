"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { HealthNav } from "@/modules/health/components/health-nav";
import { buttonVariants } from "@/components/ui/button";
import type { Surgery } from "@/lib/schema";
import { SurgeryForm } from "@/modules/health/components/surgery-form";
import {
  deleteSurgery,
  getSurgery,
  updateSurgery,
} from "@/modules/health/lib/surgeries";

export default function EditSurgeryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [surgery, setSurgery] = useState<Surgery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getSurgery(id)
      .then((s) => {
        if (!s) setError("Procedure not found");
        setSurgery(s);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppShell title="Edit procedure">
        <HealthNav />
        <p className="text-muted-foreground">
          <Loader2 className="inline size-4 animate-spin" /> Loading…
        </p>
      </AppShell>
    );
  }

  if (!surgery) {
    return (
      <AppShell title="Edit procedure">
        <HealthNav />
        <p className="text-destructive">{error ?? "Not found"}</p>
        <Link
          href="/health/surgery"
          className={buttonVariants({ className: "mt-3" })}
        >
          Back
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit procedure" subtitle={surgery.title}>
      <HealthNav />
      {error && (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <SurgeryForm
        key={surgery.id}
        initial={surgery}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          await updateSurgery(surgery.id, {
            title: values.title,
            location: values.location || null,
            notes: values.notes || null,
            status: values.status,
            cost: values.cost,
          });
          router.push("/health/surgery");
        }}
        onDelete={async () => {
          await deleteSurgery(surgery.id);
          router.push("/health/surgery");
        }}
      />
    </AppShell>
  );
}
