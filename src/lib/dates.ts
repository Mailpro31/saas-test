import { format, formatDistanceToNow } from "date-fns";

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return format(date, "MMM d, yyyy");
}

export function fmtRelative(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return formatDistanceToNow(date, { addSuffix: true });
}

// Build a Date `days` from now (used for invoice due dates from payment terms).
export function addDays(days: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

// Normalise an <input type="date"> value to a Date, or null if empty.
// A bare "YYYY-MM-DD" is parsed by `new Date()` as UTC midnight, which shifts
// to the previous day in negative-UTC timezones — so parse it as LOCAL midnight.
export function dateFromInput(value: FormDataEntryValue | null): Date | null {
  if (!value || typeof value !== "string") return null;
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const d = ymd
    ? new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]))
    : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Format a Date for an <input type="date"> default value.
export function toInputDate(d: Date | null | undefined): string {
  if (!d) return "";
  return format(d, "yyyy-MM-dd");
}
