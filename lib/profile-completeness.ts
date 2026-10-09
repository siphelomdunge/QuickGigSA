import type { WorkerProfile } from '@/lib/mock-data';

export interface CompletenessItem {
  key: string;
  label: string;
  hint: string;
  done: boolean;
  weight: number;
}

export interface Completeness {
  percent: number;
  items: CompletenessItem[];
  missing: CompletenessItem[];
}

const MIN_BIO = 40;
const MIN_EXPERIENCE = 30;
const MIN_SKILLS = 3;

/**
 * How complete a worker profile is, as clients would see it. Weighted so the things clients
 * actually read (bio, skills, verification) count more than the quick toggles.
 */
export function workerCompleteness(profile: Pick<WorkerProfile, 'bio' | 'skills' | 'experience' | 'preferred_categories' | 'location' | 'verification_status'> | null | undefined): Completeness {
  const bio = profile?.bio?.trim() ?? '';
  const experience = profile?.experience?.trim() ?? '';
  const skills = (profile?.skills ?? []).filter(Boolean);
  const categories = (profile?.preferred_categories ?? []).filter(Boolean);

  const items: CompletenessItem[] = [
    { key: 'location', label: 'Location', hint: 'So nearby gigs can find you.', done: Boolean(profile?.location?.trim()), weight: 10 },
    { key: 'bio', label: 'Short bio', hint: `At least ${MIN_BIO} characters about who you are.`, done: bio.length >= MIN_BIO, weight: 25 },
    { key: 'skills', label: `${MIN_SKILLS}+ skills`, hint: 'e.g. customer service, driving, Excel.', done: skills.length >= MIN_SKILLS, weight: 20 },
    { key: 'experience', label: 'Experience', hint: 'Past jobs, volunteering or studies count.', done: experience.length >= MIN_EXPERIENCE, weight: 15 },
    { key: 'categories', label: 'Preferred categories', hint: 'Which kinds of gigs you want.', done: categories.length >= 1, weight: 10 },
    { key: 'verification', label: 'Verified by QuickGig', hint: 'Verified profiles get picked more often.', done: profile?.verification_status === 'verified', weight: 20 },
  ];

  const total = items.reduce((sum, item) => sum + item.weight, 0);
  const earned = items.filter((item) => item.done).reduce((sum, item) => sum + item.weight, 0);
  return { percent: Math.round((earned / total) * 100), items, missing: items.filter((item) => !item.done) };
}
