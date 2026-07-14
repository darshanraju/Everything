import type { SubNavItem } from "@/components/shell/sub-nav";

/** Primary Health tabs: Routine | Surgery | Food */
export const HEALTH_SUBNAV: SubNavItem[] = [
  {
    href: "/health",
    label: "Routine",
    isActive: (pathname) => isHealthRoutinePath(pathname),
  },
  {
    href: "/health/surgery",
    label: "Surgery",
    isActive: (pathname) => pathname.startsWith("/health/surgery"),
  },
  {
    href: "/health/food",
    label: "Food",
    isActive: (pathname) => pathname.startsWith("/health/food"),
  },
];

/** Secondary chips under Routine only. */
export const ROUTINE_SUBNAV: SubNavItem[] = [
  {
    href: "/health",
    label: "Protocols",
    isActive: (pathname) =>
      pathname === "/health" || pathname.startsWith("/health/protocols"),
  },
  {
    href: "/health/history",
    label: "History",
    isActive: (pathname) => pathname.startsWith("/health/history"),
  },
];

/** Secondary chips under Food. */
export const FOOD_SUBNAV: SubNavItem[] = [
  {
    href: "/health/food",
    label: "Today",
    isActive: (pathname) =>
      pathname === "/health/food" || pathname === "/health/food/",
  },
  {
    href: "/health/food/library",
    label: "Library",
    isActive: (pathname) => pathname.startsWith("/health/food/library"),
  },
  {
    href: "/health/food/targets",
    label: "Targets",
    isActive: (pathname) => pathname.startsWith("/health/food/targets"),
  },
];

export function isHealthRoutinePath(pathname: string): boolean {
  if (pathname.startsWith("/health/surgery")) return false;
  if (pathname.startsWith("/health/food")) return false;
  return pathname === "/health" || pathname.startsWith("/health/");
}
