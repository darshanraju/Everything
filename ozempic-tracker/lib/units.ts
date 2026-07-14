/** All weight display is kilograms only — never lbs. */

export function formatKg(weight: number | string | null | undefined): string {
  if (weight === null || weight === undefined || weight === "") return "—";
  const n = typeof weight === "string" ? Number(weight) : weight;
  if (Number.isNaN(n)) return "—";
  return `${n.toFixed(1)} kg`;
}

export function formatKgDelta(delta: number | null | undefined): string {
  if (delta === null || delta === undefined || Number.isNaN(delta)) return "—";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)} kg`;
}

export function parseWeightKg(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(",", "."));
  if (Number.isNaN(n) || n <= 0 || n >= 500) return null;
  return Math.round(n * 100) / 100;
}
