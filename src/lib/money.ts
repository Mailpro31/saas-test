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

// Compact follower counts: 12500 -> "12.5K", 2_400_000 -> "2.4M"
export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}
