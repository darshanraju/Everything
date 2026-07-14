"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { HealthNav } from "@/modules/health/components/health-nav";
import { FoodForm } from "@/modules/health/components/food-form";
import { createFood } from "@/modules/health/lib/food";

export default function NewFoodPage() {
  const router = useRouter();

  return (
    <AppShell title="New food" subtitle="Macros per serving / meal">
      <HealthNav showFoodSecondary />
      <FoodForm
        submitLabel="Save food"
        onSubmit={async (values) => {
          await createFood({
            name: values.name,
            calories: values.calories,
            protein_g: values.protein_g,
            carbs_g: values.carbs_g,
            fat_g: values.fat_g,
            notes: values.notes || null,
            on_plan: values.on_plan,
          });
          router.push("/health/food/library");
        }}
      />
    </AppShell>
  );
}
