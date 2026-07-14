"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type SubNavItem = {
  href: string;
  label: string;
  /** Override default active matching */
  isActive?: (pathname: string) => boolean;
};

export function SubNav({
  items,
  className,
  muted,
}: {
  items: SubNavItem[];
  className?: string;
  /** Softer chips for secondary rows */
  muted?: boolean;
}) {
  const pathname = usePathname();
  return (
    <div className={cn("mb-5 flex flex-wrap gap-2", className)}>
      {items.map((item) => {
        const active = item.isActive
          ? item.isActive(pathname)
          : pathname === item.href ||
            (item.href !== items[0]?.href && pathname.startsWith(item.href));
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
              active
                ? muted
                  ? "bg-primary/20 text-primary"
                  : "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
