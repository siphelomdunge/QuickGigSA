import { describe, expect, it } from 'vitest';
import { workerCompleteness } from '@/lib/profile-completeness';

const full = {
  location: 'Cape Town',
  bio: 'Reliable final-year student with event and retail experience, available weekends.',
  skills: ['Customer service', 'Cash handling', 'Setup'],
  experience: 'Two years of weekend retail work and campus event volunteering.',
  preferred_categories: ['Events'],
  verification_status: 'verified' as const,
};

describe('workerCompleteness', () => {
  it('is 0% for a missing profile and 100% for a full one', () => {
    expect(workerCompleteness(null).percent).toBe(0);
    expect(workerCompleteness(full).percent).toBe(100);
    expect(workerCompleteness(full).missing).toHaveLength(0);
  });
  it('does not count a one-line bio or too few skills', () => {
    const result = workerCompleteness({ ...full, bio: 'Hi', skills: ['One'] });
    expect(result.missing.map((item) => item.key)).toEqual(['bio', 'skills']);
    expect(result.percent).toBe(55); // 100 - 25 (bio) - 20 (skills)
  });
  it('weights verification but never requires it for most of the score', () => {
    expect(workerCompleteness({ ...full, verification_status: 'pending' }).percent).toBe(80);
  });
});
