"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, History, ClipboardList } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/history", label: "History", icon: History },
  { href: "/log/new", label: "Log", icon: ClipboardList },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-primary/10 bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-soft-rose text-primary shadow-sm">
            <Heart className="size-4 fill-current" aria-hidden />
          </span>
          <span className="hidden text-sm font-bold tracking-tight text-primary sm:inline">
            My Progress
          </span>
        </div>

        <nav className="flex items-center gap-1 rounded-full bg-muted/80 p-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-card text-primary shadow-sm ring-1 ring-primary/15"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <SignOutButton />
      </div>
    </header>
  );
}
