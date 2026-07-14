"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { HealthNav } from "@/modules/health/components/health-nav";
import { buttonVariants } from "@/components/ui/button";
import type { Food } from "@/lib/schema";
import { FoodForm } from "@/modules/health/components/food-form";
import {
  deleteFood,
  getFood,
  updateFood,
} from "@/modules/health/lib/food";

export default function EditFoodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getFood(id)
      .then((f) => {
        if (!f) setError("Food not found");
        setFood(f);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AppShell title="Edit food">
        <HealthNav showFoodSecondary />
        <p className="text-muted-foreground">
          <Loader2 className="inline size-4 animate-spin" /> Loading…
        </p>
      </AppShell>
    );
  }

  if (!food) {
    return (
      <AppShell title="Edit food">
        <HealthNav showFoodSecondary />
        <p className="text-destructive">{error ?? "Not found"}</p>
        <Link
          href="/health/food/library"
          className={buttonVariants({ className: "mt-3" })}
        >
          Back
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit food" subtitle={food.name}>
      <HealthNav showFoodSecondary />
      {error && (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <FoodForm
        key={food.id}
        initial={food}
        submitLabel="Save changes"
        onSubmit={async (values) => {
          await updateFood(food.id, {
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
        onDelete={async () => {
          await deleteFood(food.id);
          router.push("/health/food/library");
        }}
      />
    </AppShell>
  );
}
