import Link from "next/link";
import { redirect } from "next/navigation";
import { TrendingDown, TrendingUp, Scale, Sparkles } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { PasskeySetupCard } from "@/components/passkey-setup-card";
import { WeeklyPromptBanner } from "@/components/weekly-prompt-banner";
import { WeightChart } from "@/components/weight-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ensureProfile,
  getUser,
  getWeeklyLogs,
  weightDeltas,
} from "@/lib/data";
import { formatKg, formatKgDelta } from "@/lib/units";
import {
  getWeekOfSaturday,
  isReminderDay,
  todayLabel,
} from "@/lib/weeks";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await ensureProfile(user.id);
  const tz = profile.timezone;
  const weekOf = getWeekOfSaturday(new Date(), tz);
  const isSaturday = isReminderDay(
    new Date(),
    tz,
    profile.reminder_weekday
  );

  const logs = await getWeeklyLogs(user.id);
  const currentLog = logs.find((l) => l.week_of === weekOf) ?? null;
  const logsAsc = [...logs].sort((a, b) =>
    a.week_of.localeCompare(b.week_of)
  );
  const deltas = weightDeltas(logsAsc);
  const chartLogs = logsAsc.slice(-12);

  const name =
    profile.display_name?.trim() ||
    user.email?.split("@")[0] ||
    "there";

  return (
    <>
      <AppNav />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-7 pb-10">
        <div>
          <p className="text-base font-semibold text-primary">Hello, {name}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">
            Your progress
          </h1>
          <p className="mt-1.5 text-base text-muted-foreground">
            {todayLabel(tz)}
          </p>
        </div>

        <WeeklyPromptBanner
          isSaturday={isSaturday}
          weekOf={weekOf}
          alreadyLogged={!!currentLog}
        />

        <PasskeySetupCard />

        <div className="grid grid-cols-2 gap-3">
          <Card className="soft-card col-span-2 rounded-2xl border-0 bg-gradient-to-br from-card to-soft-rose/60 ring-1 ring-primary/10 sm:col-span-1">
            <CardHeader className="gap-2 p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Scale className="size-4 text-primary" />
                <CardDescription className="text-sm font-semibold">
                  Latest weight
                </CardDescription>
              </div>
              <CardTitle className="stat-value text-3xl font-extrabold text-primary">
                {formatKg(deltas.latest)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="soft-card rounded-2xl border-0 bg-gradient-to-br from-card to-soft-peach/50 ring-1 ring-primary/10">
            <CardHeader className="gap-2 p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                {deltas.prevDelta !== null && deltas.prevDelta < 0 ? (
                  <TrendingDown className="size-4 text-emerald-600" />
                ) : (
                  <TrendingUp className="size-4 text-primary" />
                )}
                <CardDescription className="text-sm font-semibold">
                  vs last week
                </CardDescription>
              </div>
              <CardTitle
                className={cn(
                  "stat-value text-2xl font-extrabold sm:text-3xl",
                  deltas.prevDelta !== null &&
                    deltas.prevDelta < 0 &&
                    "text-emerald-600",
                  deltas.prevDelta !== null &&
                    deltas.prevDelta > 0 &&
                    "text-amber-700",
                  (deltas.prevDelta === null || deltas.prevDelta === 0) &&
                    "text-foreground"
                )}
              >
                {formatKgDelta(deltas.prevDelta)}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="soft-card col-span-2 rounded-2xl border-0 bg-gradient-to-br from-card to-soft-lilac/50 ring-1 ring-primary/10">
            <CardHeader className="gap-2 p-5">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="size-4 text-primary" />
                <CardDescription className="text-sm font-semibold">
                  Total change since first log
                </CardDescription>
              </div>
              <CardTitle
                className={cn(
                  "stat-value text-3xl font-extrabold",
                  deltas.totalDelta !== null &&
                    deltas.totalDelta < 0 &&
                    "text-emerald-600",
                  deltas.totalDelta !== null &&
                    deltas.totalDelta > 0 &&
                    "text-amber-700",
                  (deltas.totalDelta === null || deltas.totalDelta === 0) &&
                    "text-foreground"
                )}
              >
                {formatKgDelta(deltas.totalDelta)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="soft-card rounded-3xl border-0 ring-1 ring-primary/10">
          <CardHeader className="pb-1">
            <CardTitle className="text-xl font-bold">Weight over time</CardTitle>
            <CardDescription className="text-base">
              All values in kilograms (kg)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeightChart logs={chartLogs} />
          </CardContent>
        </Card>

        <Link
          href="/history"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-14 w-full justify-center rounded-full border-primary/20 bg-card text-base font-bold text-primary hover:bg-soft-rose"
          )}
        >
          View full history
        </Link>
      </main>
    </>
  );
}
