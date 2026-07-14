import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import { CheckInForm } from "@/components/check-in-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ensureProfile,
  getLogForWeek,
  getUser,
} from "@/lib/data";
import { formatWeekOf, getWeekOfSaturday } from "@/lib/weeks";
import { cn } from "@/lib/utils";

export default async function NewLogPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await ensureProfile(user.id);
  const weekOf = getWeekOfSaturday(new Date(), profile.timezone);
  const existing = await getLogForWeek(user.id, weekOf);

  return (
    <>
      <AppNav />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-7 pb-10">
        {existing ? (
          <Card className="soft-card rounded-3xl border-0 ring-1 ring-emerald-200/70">
            <CardHeader className="space-y-3 text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-8" />
              </span>
              <CardTitle className="text-2xl font-bold">
                Already logged
              </CardTitle>
              <CardDescription className="text-base leading-relaxed">
                You already saved a check-in for week of{" "}
                <strong className="font-semibold text-foreground">
                  {formatWeekOf(weekOf)}
                </strong>
                .
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 justify-center rounded-full text-base font-bold shadow-md shadow-primary/20"
                )}
              >
                Back to home
              </Link>
              <Link
                href="/history"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 justify-center rounded-full border-primary/20 text-base font-semibold text-primary hover:bg-soft-rose"
                )}
              >
                View history
              </Link>
            </CardContent>
          </Card>
        ) : (
          <CheckInForm userId={user.id} weekOf={weekOf} />
        )}
      </main>
    </>
  );
}
