"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Scale } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SCALE_PHOTOS_BUCKET, SUPABASE_SCHEMA } from "@/lib/schema";
import { parseWeightKg } from "@/lib/units";
import { formatWeekOf } from "@/lib/weeks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  userId: string;
  weekOf: string;
};

export function CheckInForm({ userId, weekOf }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tookOzempic, setTookOzempic] = useState(true);
  const [weight, setWeight] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function onFileChange(f: File | null) {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const weightKg = parseWeightKg(weight);
    if (weightKg === null) {
      setError("Please enter a valid weight in kg (for example 72.5).");
      return;
    }
    if (!file) {
      setError("Please add a photo of the scale showing your weight.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ["jpg", "jpeg", "png", "webp", "heic"].includes(ext)
        ? ext
        : "jpg";
      const path = `${userId}/${weekOf}.${safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from(SCALE_PHOTOS_BUCKET)
        .upload(path, file, {
          upsert: true,
          contentType: file.type || "image/jpeg",
        });

      if (uploadError) {
        throw new Error(uploadError.message || "Photo upload failed.");
      }

      const { error: insertError } = await supabase
        .schema(SUPABASE_SCHEMA)
        .from("weekly_logs")
        .insert({
          user_id: userId,
          week_of: weekOf,
          took_ozempic: tookOzempic,
          weight_kg: weightKg,
          scale_photo_path: path,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error(
            "You already logged this week. View it on your dashboard."
          );
        }
        throw new Error(insertError.message || "Could not save your log.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <Card className="soft-card rounded-3xl border-0 ring-1 ring-primary/10">
      <CardHeader className="space-y-2 pb-2">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Weekly check-in
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Week of{" "}
          <strong className="font-semibold text-foreground">
            {formatWeekOf(weekOf)}
          </strong>
          {" · "}
          Weight in kilograms only
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="flex items-start gap-4 rounded-2xl border border-primary/10 bg-soft-rose/50 p-4">
            <Checkbox
              id="took_ozempic"
              checked={tookOzempic}
              onCheckedChange={(v) => setTookOzempic(v === true)}
              className="mt-1 size-6 rounded-md border-primary/30 data-checked:bg-primary"
            />
            <div className="grid gap-1">
              <Label
                htmlFor="took_ozempic"
                className="text-lg font-semibold leading-snug"
              >
                I took my Ozempic this week
              </Label>
              <p className="text-base text-muted-foreground">
                Untick if you missed this week&apos;s dose.
              </p>
            </div>
          </div>

          <div className="grid gap-2.5">
            <Label
              htmlFor="weight_kg"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Scale className="size-5 text-primary" />
              Weight (kg)
            </Label>
            <Input
              id="weight_kg"
              name="weight_kg"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="1"
              max="499"
              placeholder="e.g. 72.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="h-14 rounded-2xl border-primary/15 bg-soft-peach/40 px-4 text-2xl font-semibold shadow-none focus-visible:bg-card"
              required
            />
            <p className="text-sm text-muted-foreground">
              Enter the number exactly as shown on your scale, in kg.
            </p>
          </div>

          <div className="grid gap-2.5">
            <Label className="flex items-center gap-2 text-lg font-semibold">
              <Camera className="size-5 text-primary" />
              Scale photo
            </Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary/25 bg-soft-lilac/50 px-4 py-6 text-center transition-colors hover:border-primary/40 hover:bg-soft-rose/40"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Scale preview"
                  className="max-h-52 rounded-xl object-contain shadow-sm"
                />
              ) : (
                <>
                  <span className="flex size-14 items-center justify-center rounded-full bg-card text-primary shadow-sm">
                    <Camera className="size-7" />
                  </span>
                  <span className="text-base font-semibold text-foreground">
                    Take or upload a photo of the scale
                  </span>
                  <span className="max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
                    So the number on the display is clear and easy to see
                  </span>
                </>
              )}
            </button>
            {file && (
              <p className="truncate text-sm text-muted-foreground">
                {file.name}
              </p>
            )}
          </div>

          {error && (
            <p
              className="rounded-2xl bg-destructive/10 px-4 py-3 text-base text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            className="h-14 w-full rounded-full text-lg font-bold shadow-md shadow-primary/25"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save this week’s update"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
