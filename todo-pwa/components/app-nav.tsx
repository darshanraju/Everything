"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckSquare, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Tasks", icon: CheckSquare },
  { href: "/stats", label: "Stats", icon: BarChart3 },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-border/80 bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <span className="text-sm font-bold tracking-tight text-primary">
          Todo
        </span>
        <nav className="flex items-center gap-1 rounded-full bg-muted/80 p-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-card text-primary shadow-sm ring-1 ring-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
