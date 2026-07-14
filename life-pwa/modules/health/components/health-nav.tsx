"use client";

import { SubNav } from "@/components/shell/sub-nav";
import {
  FOOD_SUBNAV,
  HEALTH_SUBNAV,
  ROUTINE_SUBNAV,
} from "@/modules/health/nav";

/** Primary Routine | Surgery | Food; optional secondary under Routine or Food. */
export function HealthNav({
  showRoutineSecondary = false,
  showFoodSecondary = false,
}: {
  showRoutineSecondary?: boolean;
  showFoodSecondary?: boolean;
}) {
  const hasSecondary = showRoutineSecondary || showFoodSecondary;
  return (
    <>
      <SubNav items={HEALTH_SUBNAV} className={hasSecondary ? "mb-2" : undefined} />
      {showRoutineSecondary ? (
        <SubNav items={ROUTINE_SUBNAV} muted className="mb-5" />
      ) : null}
      {showFoodSecondary ? (
        <SubNav items={FOOD_SUBNAV} muted className="mb-5" />
      ) : null}
    </>
  );
}
