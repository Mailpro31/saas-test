// Money is stored everywhere as an integer number of minor units (cents) to
// avoid floating-point rounding errors.

export function formatMoney(minor: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(minor / 100);
  } catch {
    // Unknown currency code — fall back to a plain number with the code.
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}

// Parse a user-entered amount like "1,250.50" or "1250" into minor units.
export function parseMoney(input: string): number {
  const cleaned = String(input).replace(/[^0-9.-]/g, "");
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

// Sum minor-unit amounts grouped by currency (so we never add EUR to USD).
export function sumByCurrency(
  items: { amount: number; currency: string }[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) {
    out[it.currency] = (out[it.currency] ?? 0) + it.amount;
  }
  return out;
}

// Render per-currency totals like "$1,200.00 · €800.00". Falls back to a zero
// amount in `fallbackCurrency` when there's nothing to show.
export function formatTotals(
  totals: Record<string, number>,
  fallbackCurrency: string,
): string {
  const entries = Object.entries(totals).filter(([, v]) => v !== 0);
  if (entries.length === 0) return formatMoney(0, fallbackCurrency);
  return entries.map(([c, v]) => formatMoney(v, c)).join(" · ");
}

// Compact follower counts: 12500 -> "12.5K", 2_400_000 -> "2.4M"
export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}
