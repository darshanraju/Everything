"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { enabledModules } from "@/modules/registry";
import { cn } from "@/lib/utils";

export function ModuleTabs() {
  const pathname = usePathname();
  const modules = enabledModules();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border/80 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex max-w-lg">
        {modules.map((m) => {
          const active =
            pathname === m.href || pathname.startsWith(`${m.href}/`);
          const Icon = m.icon;
          return (
            <Link
              key={m.key}
              href={m.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5" aria-hidden />
              {m.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
