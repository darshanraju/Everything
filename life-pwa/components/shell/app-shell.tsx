import Link from "next/link";
import { ModuleTabs } from "@/components/shell/module-tabs";

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col pb-24">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4">
          <Link href="/fitness" className="text-sm font-bold tracking-tight text-primary">
            Life
          </Link>
          {actions}
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5">
        {(title || subtitle) && (
          <div className="mb-5">
            {title && (
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </main>
      <ModuleTabs />
    </div>
  );
}
