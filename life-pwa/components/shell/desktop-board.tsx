import { cn } from "@/lib/utils";

/**
 * Responsive board: stacked on phone, multi-column on desktop.
 * Uses CSS grid (not columns) so every card stays visible.
 */
export function DesktopBoard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        "lg:grid lg:grid-cols-2 lg:items-start lg:gap-3",
        "xl:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Card panel for desktop/mobile boards */
export function DesktopCard({
  title,
  children,
  className,
  actions,
  /** Constrain height and scroll content (dashboard panels). */
  scrollBody = false,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  scrollBody?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/80 bg-card/60 p-3",
        scrollBody && "flex min-h-0 flex-col overflow-hidden",
        className
      )}
    >
      {(title || actions) && (
        <div
          className={cn(
            "mb-2 flex items-center justify-between gap-2",
            scrollBody && "shrink-0"
          )}
        >
          {title ? (
            <h2 className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {actions}
        </div>
      )}
      {scrollBody ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      ) : (
        children
      )}
    </section>
  );
}
