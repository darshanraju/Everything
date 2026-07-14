import type { TodayContributor } from "@/modules/today/types";
import { fitnessTodayContributor } from "@/modules/fitness/today";
import { healthTodayContributor } from "@/modules/health/today";
import { foodTodayContributor } from "@/modules/food/today";
import { manualTodayContributor } from "@/modules/manual/today";

/**
 * Register Today feed sources here.
 * To add a future tab: implement modules/<key>/today.ts and append below.
 */
export const TODAY_CONTRIBUTORS: TodayContributor[] = [
  fitnessTodayContributor,
  healthTodayContributor,
  foodTodayContributor,
  manualTodayContributor,
];
