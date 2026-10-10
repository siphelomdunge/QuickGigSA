const rand = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 });

/** R1 250 style, no cents. */
export function formatRand(amount: number): string {
  return rand.format(amount).replace(/ZAR\s?/, 'R').replace(/\u00a0/g, ' ').replace(/^R\s+/, 'R');
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Parses a YYYY-MM-DD string as a local date; null when unparsable. */
function parseIsoDate(date: string): Date | null {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** "2026-06-02" — the one date format used across the app. */
export function formatDateShort(date: string): string {
  const parsed = parseIsoDate(date);
  if (!parsed) return date;
  return toIsoDate(parsed);
}

/** "Tuesday, 2026-06-02" */
export function formatDateLong(date: string): string {
  const parsed = parseIsoDate(date);
  if (!parsed) return date;
  return `${WEEKDAYS[parsed.getDay()]}, ${toIsoDate(parsed)}`;
}

/** Formats any Date (e.g. a created_at timestamp) as YYYY-MM-DD in local time. */
export function toIsoDate(value: Date | string): string {
  const parsed = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(parsed.getTime())) return String(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}
