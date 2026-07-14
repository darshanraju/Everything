import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  CalendarDays,
  Dumbbell,
  HeartPulse,
} from "lucide-react";

/** Stable keys for modules — add new keys here when extending Life. */
export type ModuleKey = "today" | "fitness" | "health" | "shared";
// Future: | "journal" | "finance"

export type AppModule = {
  key: ModuleKey;
  label: string;
  href: string;
  icon: LucideIcon;
  enabled: boolean;
  description?: string;
};

export const MODULES: AppModule[] = [
  {
    key: "today",
    label: "Today",
    href: "/today",
    icon: CalendarDays,
    enabled: true,
    description: "Daily feed from all modules + your own tasks",
  },
  {
    key: "fitness",
    label: "Fitness",
    href: "/fitness",
    icon: Dumbbell,
    enabled: true,
    description: "Programs, weekly plan, body weight",
  },
  {
    key: "health",
    label: "Health",
    href: "/health",
    icon: HeartPulse,
    enabled: true,
    description: "Meds, peptides, skincare, supplements",
  },
  {
    key: "shared",
    label: "Shared",
    href: "/shared",
    icon: Bookmark,
    enabled: true,
    description: "Links saved via share or paste",
  },
];

export function enabledModules(): AppModule[] {
  return MODULES.filter((m) => m.enabled);
}

export function moduleByPath(pathname: string): AppModule | undefined {
  return enabledModules().find(
    (m) => pathname === m.href || pathname.startsWith(`${m.href}/`)
  );
}
