"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { HealthNav } from "@/modules/health/components/health-nav";
import { createProtocol } from "@/modules/health/lib/api";
import { ProtocolForm } from "@/modules/health/components/protocol-form";

export default function NewProtocolPage() {
  const router = useRouter();

  return (
    <AppShell
      title="New protocol"
      subtitle="Medicine, peptide, skincare, supplement…"
    >
      <HealthNav showRoutineSecondary />
      <ProtocolForm
        submitLabel="Save protocol"
        onSubmit={async (values) => {
          await createProtocol({
            name: values.name,
            category: values.category,
            amount: values.amount,
            unit: values.unit,
            syringe_units: values.syringe_units,
            frequency: values.frequency,
            frequency_note: values.frequency_note,
            schedule_weekdays: values.schedule_weekdays,
            notes: values.notes,
          });
          router.push("/health");
        }}
      />
    </AppShell>
  );
}
