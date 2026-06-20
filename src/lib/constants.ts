// Pipeline stages in order. `Lost` is terminal and shown separately.
export const STAGES = [
  "Pitch",
  "Negotiating",
  "Confirmed",
  "InProgress",
  "Delivered",
  "Invoiced",
  "Paid",
] as const;

export type Stage = (typeof STAGES)[number];

export const ALL_STAGES = [...STAGES, "Lost"] as const;

export const STAGE_LABELS: Record<string, string> = {
  Pitch: "Pitch",
  Negotiating: "Negotiating",
  Confirmed: "Confirmed",
  InProgress: "In progress",
  Delivered: "Delivered",
  Invoiced: "Invoiced",
  Paid: "Paid",
  Lost: "Lost",
};

// Tailwind classes for stage chips/columns.
export const STAGE_STYLES: Record<string, string> = {
  Pitch: "bg-slate-100 text-slate-700 border-slate-200",
  Negotiating: "bg-amber-100 text-amber-800 border-amber-200",
  Confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  InProgress: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Delivered: "bg-violet-100 text-violet-800 border-violet-200",
  Invoiced: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  Paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Lost: "bg-rose-100 text-rose-700 border-rose-200",
};

export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;

export const PLATFORM_OPTIONS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "X",
  "LinkedIn",
  "Twitch",
  "Newsletter",
  "Podcast",
  "Other",
] as const;
