import Link from "next/link";
import { ModuleTabs } from "@/components/shell/module-tabs";
import { cn } from "@/lib/utils";

export type ShellLayout = "phone" | "desktop";

export function AppShell({
  children,
  title,
  subtitle,
  actions,
  /**
   * phone  — narrow max-w-lg (default mobile feel)
   * desktop — widens on lg+ for multi-column boards
   */
  layout = "phone",
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  layout?: ShellLayout;
}) {
  const wide = layout === "desktop";
  const maxW = wide ? "max-w-lg lg:max-w-6xl" : "max-w-lg";

  return (
    <div className="flex min-h-full flex-col pb-24">
      <header className="sticky top-0 z-10 shrink-0 border-b border-border/60 bg-card/80 backdrop-blur-md">
        <div
          className={cn(
            "mx-auto flex h-14 w-full items-center justify-between gap-3 px-4",
            maxW
          )}
        >
          <Link
            href="/today"
            className="text-sm font-bold tracking-tight text-primary"
          >
            Life
          </Link>
          {actions}
        </div>
      </header>
      <main className={cn("mx-auto w-full flex-1 px-4 py-5", maxW)}>
        {(title || subtitle) && (
          <div className="mb-4 lg:mb-5">
            {title && (
              <h1 className="text-2xl font-bold tracking-tight lg:text-xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </main>
      <ModuleTabs wide={wide} />
    </div>
  );
}
