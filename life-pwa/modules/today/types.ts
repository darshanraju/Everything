/**
 * Modular Today feed + SLA contract.
 * Each module implements a TodayContributor; Today/Stats only aggregate.
 */

export type TodaySourceKey = string;
// Built-ins: "fitness" | "health" | "manual"
// Future: "journal" | "finance" | ...

export type TodayItem = {
  /** Globally unique: `${sourceKey}:${localId}` */
  id: string;
  sourceKey: TodaySourceKey;
  title: string;
  subtitle?: string;
  href?: string;
  status: "pending" | "done";
  sortOrder?: number;
  completeAction?: "toggle" | "none";
  meta?: Record<string, unknown>;
};

/** Daily expected vs completed for SLA charts */
export type DayScore = {
  date: string; // yyyy-MM-dd local
  expected: number;
  completed: number;
};

export type TodayContributor = {
  sourceKey: TodaySourceKey;
  label: string;
  enabled: boolean;
  getItems(date: Date): Promise<TodayItem[]>;
  completeItem?(item: TodayItem): Promise<void>;
  /** Optional: daily scores for SLA / consistency charts */
  getDayScores?(from: Date, to: Date): Promise<DayScore[]>;
};

export type TodaySection = {
  sourceKey: TodaySourceKey;
  label: string;
  items: TodayItem[];
  completeItem?: (item: TodayItem) => Promise<void>;
};
