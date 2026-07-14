import Link from "next/link";
import { Sparkles, Heart, CalendarHeart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatWeekOf } from "@/lib/weeks";

type Props = {
  isSaturday: boolean;
  weekOf: string;
  alreadyLogged: boolean;
};

export function WeeklyPromptBanner({
  isSaturday,
  weekOf,
  alreadyLogged,
}: Props) {
  if (alreadyLogged) {
    return (
      <Card className="soft-card overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-emerald-50 to-teal-50/80 ring-1 ring-emerald-200/60">
        <CardContent className="flex items-start gap-4 p-5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-emerald-600 shadow-sm">
            <Heart className="size-6 fill-emerald-200" />
          </span>
          <div>
            <p className="text-lg font-bold text-emerald-900">
              All done for this week
            </p>
            <p className="mt-1 text-base leading-relaxed text-emerald-800/85">
              Week of {formatWeekOf(weekOf)} is logged. You&apos;re doing
              wonderfully.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isSaturday) {
    return (
      <Card className="soft-card overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-soft-rose via-card to-soft-peach ring-1 ring-primary/20">
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm">
              <Sparkles className="size-6" />
            </span>
            <div>
              <p className="text-xl font-bold tracking-tight text-foreground">
                Saturday check-in time
              </p>
              <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
                Take a moment for your Ozempic dose, weight in{" "}
                <strong className="font-semibold text-foreground">kg</strong>,
                and a quick photo of the scale.
              </p>
            </div>
          </div>
          <Link
            href="/log/new"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 w-full shrink-0 justify-center rounded-full px-6 text-base font-semibold shadow-md shadow-primary/20 sm:w-auto"
            )}
          >
            Log this week
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="soft-card overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-soft-lilac to-card ring-1 ring-primary/10">
      <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary shadow-sm">
            <CalendarHeart className="size-6" />
          </span>
          <div>
            <p className="text-lg font-bold text-foreground">
              Catch up when you can
            </p>
            <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">
              No log yet for week of{" "}
              <strong className="font-semibold text-foreground">
                {formatWeekOf(weekOf)}
              </strong>
              . You can still add it.
            </p>
          </div>
        </div>
        <Link
          href="/log/new"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-12 w-full justify-center rounded-full border-primary/25 bg-card px-6 text-base font-semibold text-primary hover:bg-soft-rose sm:w-auto"
          )}
        >
          Log this week
        </Link>
      </CardContent>
    </Card>
  );
}
