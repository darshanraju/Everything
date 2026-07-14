import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatWeekOf } from "@/lib/weeks";
import { formatKg } from "@/lib/units";
import type { WeeklyLog } from "@/lib/schema";

export type LogWithPhoto = WeeklyLog & { photoUrl: string | null };

type Props = {
  logs: LogWithPhoto[];
};

export function LogList({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-primary/20 bg-soft-rose/40 px-5 py-12 text-center text-base leading-relaxed text-muted-foreground">
        No weekly logs yet.
        <br />
        Your first Saturday check-in will appear here.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {logs.map((log) => (
        <li key={log.id}>
          <Card className="soft-card overflow-hidden rounded-2xl border-0 ring-1 ring-primary/10">
            <CardContent className="flex gap-4 p-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-soft-peach ring-1 ring-primary/10 sm:size-24">
                <div className="relative size-full min-h-20 min-w-20">
                  {log.photoUrl ? (
                    <Image
                      src={log.photoUrl}
                      alt={`Scale photo for week of ${formatWeekOf(log.week_of)}`}
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full min-h-20 items-center justify-center px-2 text-center text-xs text-muted-foreground">
                      No photo
                    </div>
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-bold text-foreground">
                    Week of {formatWeekOf(log.week_of)}
                  </p>
                  <Badge
                    variant={log.took_ozempic ? "default" : "secondary"}
                    className={
                      log.took_ozempic
                        ? "rounded-full bg-primary/90 px-2.5 py-0.5 text-xs font-semibold"
                        : "rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground"
                    }
                  >
                    {log.took_ozempic ? "Took Ozempic" : "Missed dose"}
                  </Badge>
                </div>
                <p className="stat-value mt-2 text-3xl font-extrabold tracking-tight text-primary">
                  {formatKg(log.weight_kg)}
                </p>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
