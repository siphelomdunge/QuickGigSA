const rand = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 });

/** R1 250 style, no cents. */
export function formatRand(amount: number): string {
  return rand.format(amount).replace(/ZAR\s?/, 'R').replace(/\u00a0/g, ' ').replace(/^R\s+/, 'R');
}

/** "Tue, 2 Jun" — falls back to the raw string for anything unparsable. */
export function formatDateShort(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "Tuesday, 2 June 2026" */
export function formatDateLong(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
