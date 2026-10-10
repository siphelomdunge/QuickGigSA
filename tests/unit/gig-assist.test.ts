import { describe, expect, it } from 'vitest';
import { fallbackSuggest, parseDraft, sanitize } from '@/lib/gig-assist';

describe('sanitize', () => {
  it('leaves clean text untouched', () => {
    const result = sanitize('Help serve customers at a food stall. Bring comfortable shoes.');
    expect(result.text).toBe('Help serve customers at a food stall.\nBring comfortable shoes.');
    expect(result.flags).toEqual([]);
  });

  it.each([
    ['email', 'Email me at nandi@example.com to confirm.'],
    ['local phone', 'Call 082 123 4567 if you are keen.'],
    ['intl phone', 'WhatsApp +27 82 123 4567.'],
    ['ID number', 'Send your ID number 9001015009087 first.'],
  ])('drops sentences with contact details (%s)', (_label, bad) => {
    const result = sanitize(`We need two helpers. ${bad} Shift starts at ten.`);
    expect(result.text).not.toContain(bad);
    expect(result.text).toContain('We need two helpers.');
    expect(result.text).toContain('Shift starts at ten.');
    expect(result.flags).toContain('Removed contact details. Workers get them after you accept.');
  });

  it.each(['Females only please.', 'Must be South African.', 'No foreigners.', 'Men preferred for lifting.'])(
    'drops discriminatory requirements (%s)',
    (bad) => {
      const result = sanitize(`Lift boxes. ${bad}`);
      expect(result.text).toBe('Lift boxes.');
      expect(result.flags).toContain('Removed a requirement that limits applicants by gender, race or nationality.');
    },
  );

  it('drops worker-fee demands', () => {
    const result = sanitize('Great gig. A registration fee of R50 applies. Start Monday.');
    expect(result.text).toBe('Great gig.\nStart Monday.');
    expect(result.flags).toContain('Removed a line asking workers to pay a fee.');
  });

  it('drops Rand amounts that contradict the pay field, but keeps matching ones', () => {
    const result = sanitize('Pay is R250 for the day. Bonus of R1 000 for top performer.', 250);
    expect(result.text).toBe('Pay is R250 for the day.');
    expect(result.flags).toContain('Removed an amount that does not match the Pay field.');
  });

  it('does not police amounts when no pay is given', () => {
    expect(sanitize('Pay is R250 for the day.').flags).toEqual([]);
  });
});

describe('parseDraft', () => {
  it('rejects empty input', () => {
    expect(parseDraft({})).toBeNull();
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft({ title: '   ' })).toBeNull();
  });

  it('never accepts a private address field', () => {
    const draft = parseDraft({ title: 'Help', address_private: '21 Juta Street' });
    expect(draft).not.toBeNull();
    expect(JSON.stringify(draft)).not.toContain('Juta');
  });

  it('clamps long input', () => {
    const draft = parseDraft({ title: 'x'.repeat(10_000), description: 'y'.repeat(100_000) });
    expect(draft!.title.length).toBeLessThan(10_000);
    expect(draft!.description.length).toBeLessThan(100_000);
  });
});

describe('fallbackSuggest', () => {
  it('produces a usable, sanitised listing from a rough draft', () => {
    const draft = parseDraft({
      title: 'HELP AT MARKET',
      description: 'need 2 ppl to serve food, call 0821234567',
      requirements: 'friendly, females only',
      pay_amount: 300,
    })!;
    const result = fallbackSuggest(draft);
    expect(result.description.length).toBeGreaterThan(20);
    expect(result.description).not.toMatch(/0821234567/);
    expect(result.requirements).not.toMatch(/females only/i);
    expect(result.flags.length).toBeGreaterThan(0);
    expect(result.source).toBe('fallback');
  });
});
