"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { buttonVariants } from "@/components/ui/button";
import type { HealthProtocol } from "@/lib/schema";
import { HealthNav } from "@/modules/health/components/health-nav";
import {
  deleteProtocol,
  getProtocol,
  updateProtocol,
} from "@/modules/health/lib/api";
import { ProtocolForm } from "@/modules/health/components/protocol-form";

export default function EditProtocolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [protocol, setProtocol] = useState<HealthProtocol | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getProtocol(id)
      .then((p) => {
        if (!p) setError("Protocol not found");
        setProtocol(p);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppShell title="Edit protocol">
        <HealthNav showRoutineSecondary />
        <p className="text-muted-foreground">
          <Loader2 className="inline size-4 animate-spin" /> Loading…
        </p>
      </AppShell>
    );
  }

  if (!protocol) {
    return (
      <AppShell title="Edit protocol">
        <HealthNav showRoutineSecondary />
        <p className="text-destructive">{error ?? "Not found"}</p>
        <Link href="/health" className={buttonVariants({ className: "mt-3" })}>
          Back
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit protocol" subtitle={protocol.name}>
      <HealthNav showRoutineSecondary />
      {error && (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <ProtocolForm
        key={protocol.id}
        initial={protocol}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          await updateProtocol(protocol.id, {
            name: values.name,
            category: values.category,
            amount: values.amount,
            unit: values.unit,
            syringe_units: values.syringe_units,
            frequency: values.frequency,
            frequency_note: values.frequency_note,
            schedule_weekdays: values.schedule_weekdays,
            notes: values.notes,
            active: values.active,
          });
          router.push("/health");
        }}
        onDelete={async () => {
          await deleteProtocol(protocol.id);
          router.push("/health");
        }}
      />
    </AppShell>
  );
}
