"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { HealthNav } from "@/modules/health/components/health-nav";
import { SurgeryForm } from "@/modules/health/components/surgery-form";
import { createSurgery } from "@/modules/health/lib/surgeries";

export default function NewSurgeryPage() {
  const router = useRouter();

  return (
    <AppShell
      title="New procedure"
      subtitle="Rhinoplasty, transplant, jaw surgery…"
    >
      <HealthNav />
      <SurgeryForm
        submitLabel="Save procedure"
        onSubmit={async (values) => {
          await createSurgery({
            title: values.title,
            location: values.location || null,
            notes: values.notes || null,
            status: values.status,
            cost: values.cost,
          });
          router.push("/health/surgery");
        }}
      />
    </AppShell>
  );
}
