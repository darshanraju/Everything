import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  CalendarDays,
  Dumbbell,
  HeartPulse,
  StickyNote,
} from "lucide-react";

/** Stable keys for modules — add new keys here when extending Life. */
export type ModuleKey = "today" | "fitness" | "health" | "shared" | "notes";
// Future: | "journal" | "finance"

export type AppModule = {
  key: ModuleKey;
  label: string;
  href: string;
  icon: LucideIcon;
  enabled: boolean;
  description?: string;
};

/** Order = bottom tab order. Today is center with 5 tabs. */
export const MODULES: AppModule[] = [
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
    key: "today",
    label: "Today",
    href: "/today",
    icon: CalendarDays,
    enabled: true,
    description: "Daily feed from all modules + your own tasks",
  },
  {
    key: "shared",
    label: "Shared",
    href: "/shared",
    icon: Bookmark,
    enabled: true,
    description: "Links saved via share or paste",
  },
  {
    key: "notes",
    label: "Notes",
    href: "/notes",
    icon: StickyNote,
    enabled: true,
    description: "Feature ideas and scratchpad",
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
