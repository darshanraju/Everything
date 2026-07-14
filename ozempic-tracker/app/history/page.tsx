import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { LogList, type LogWithPhoto } from "@/components/log-list";
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
  getSignedPhotoUrl,
  getUser,
  getWeeklyLogs,
  weightDeltas,
} from "@/lib/data";
import { formatKg, formatKgDelta } from "@/lib/units";

export default async function HistoryPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  await ensureProfile(user.id);
  const logs = await getWeeklyLogs(user.id);
  const logsAsc = [...logs].sort((a, b) =>
    a.week_of.localeCompare(b.week_of)
  );
  const deltas = weightDeltas(logsAsc);

  const withPhotos: LogWithPhoto[] = await Promise.all(
    logs.map(async (log) => ({
      ...log,
      photoUrl: await getSignedPhotoUrl(log.scale_photo_path),
    }))
  );

  return (
    <>
      <AppNav />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-7 pb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">History</h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Weight in{" "}
            <span className="font-semibold text-primary">kg</span>
            {" · "}
            {logs.length} weekly {logs.length === 1 ? "entry" : "entries"}
            {deltas.totalDelta !== null && (
              <>
                {" · "}
                total change{" "}
                <span className="font-semibold text-foreground">
                  {formatKgDelta(deltas.totalDelta)}
                </span>
              </>
            )}
          </p>
        </div>

        <Card className="soft-card rounded-3xl border-0 ring-1 ring-primary/10">
          <CardHeader className="pb-1">
            <CardTitle className="text-xl font-bold">Progress chart</CardTitle>
            <CardDescription className="text-base leading-relaxed">
              Latest:{" "}
              <span className="font-semibold text-foreground">
                {formatKg(deltas.latest)}
              </span>
              {" · "}
              vs last week:{" "}
              <span className="font-semibold text-foreground">
                {formatKgDelta(deltas.prevDelta)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeightChart logs={logsAsc} height={280} />
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-xl font-bold">Weekly logs</h2>
          <LogList logs={withPhotos} />
        </div>
      </main>
    </>
  );
}
