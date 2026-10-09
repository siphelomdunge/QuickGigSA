import { describe, expect, it } from 'vitest';
import { buildThreads, countUnread, formatRelative, groupByDay } from '@/lib/messaging';
import { mockApplications, mockGigs, mockMessages, mockUsers } from '@/lib/mock-data';

const base = { applications: mockApplications, gigs: mockGigs, users: mockUsers, messages: mockMessages };

describe('buildThreads', () => {
  it('only includes accepted/completed applications the user is a party to', () => {
    const worker = buildThreads({ userId: 'user_1', ...base }); // Anele: app_2 accepted (gig_2), app_4 ?
    for (const thread of worker) {
      expect(['accepted', 'completed']).toContain(thread.application.status);
      expect(thread.application.worker_id === 'user_1' || thread.gig?.client_id === 'user_1').toBe(true);
    }
    expect(worker.some((t) => t.application.id === 'app_2')).toBe(true);
  });

  it('shows the counterpart from each side', () => {
    const asWorker = buildThreads({ userId: 'user_1', ...base }).find((t) => t.application.id === 'app_2')!;
    const asClient = buildThreads({ userId: 'user_2', ...base }).find((t) => t.application.id === 'app_2')!;
    expect(asWorker.counterpart?.id).toBe('user_2');
    expect(asClient.counterpart?.id).toBe('user_1');
    expect(asClient.counterpart?.name).toBe(asClient.application.worker_name);
  });

  it('counts only unread messages sent by the other person', () => {
    // msg_2 was sent by the worker (user_1) and is unread → client has 1 unread, worker 0.
    expect(countUnread({ userId: 'user_2', ...base })).toBe(1);
    expect(countUnread({ userId: 'user_1', ...base })).toBe(0);
  });

  it('excludes strangers and pending applicants entirely', () => {
    expect(buildThreads({ userId: 'user_5', ...base }).some((t) => t.application.id === 'app_2')).toBe(false);
    expect(buildThreads({ userId: 'user_4', ...base }).some((t) => t.application.id === 'app_1')).toBe(false); // app_1 pending
  });

  it('sorts newest activity first', () => {
    const messages = [
      ...mockMessages,
      { id: 'm_new', application_id: 'app_4', sender_id: 'user_1', body: 'later', created_at: '2026-06-10T10:00:00.000Z', read_at: null },
    ];
    const apps = mockApplications.map((a) => (a.id === 'app_4' ? { ...a, status: 'accepted' as const } : a));
    const threads = buildThreads({ userId: 'user_1', ...base, applications: apps, messages });
    expect(threads[0]?.application.id).toBe('app_4');
  });
});

describe('formatRelative', () => {
  const now = new Date('2026-06-02T12:00:00');
  it.each([
    ['2026-06-02T11:59:40', 'Just now'],
    ['2026-06-02T11:45:00', '15 min'],
    ['2026-06-02T09:05:00', '09:05'],
    ['2026-06-01T20:30:00', 'Yesterday 20:30'],
    ['2026-05-20T08:00:00', '2026-05-20'],
  ])('%s → %s', (iso, expected) => {
    expect(formatRelative(new Date(iso).toISOString(), now)).toBe(expected);
  });
});

describe('groupByDay', () => {
  it('groups consecutive messages by calendar day', () => {
    const groups = groupByDay([
      { id: 'a', application_id: 'x', sender_id: 'u', body: '1', created_at: '2026-05-01T08:00:00', read_at: null },
      { id: 'b', application_id: 'x', sender_id: 'u', body: '2', created_at: '2026-05-01T09:00:00', read_at: null },
      { id: 'c', application_id: 'x', sender_id: 'u', body: '3', created_at: '2026-05-02T09:00:00', read_at: null },
    ]);
    expect(groups.map((g) => g.messages.length)).toEqual([2, 1]);
  });
});
