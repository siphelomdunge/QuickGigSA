/**
 * Integration tests for the demo-mode (no Supabase) flows.
 *
 * These render the real AuthProvider + PlatformStoreProvider and real pages in jsdom,
 * with only next/navigation mocked. State persists in localStorage between renders,
 * exactly as it does in the browser, so one test can play several roles in sequence.
 */
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Suspense, type ReactNode } from 'react';

const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn(), refresh: vi.fn() };
vi.mock('next/navigation', () => ({
  useRouter: () => router,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

import { Providers } from '@/app/providers';
import LoginPage from '@/app/login/page';
import RegisterPage from '@/app/register/page';
import PostGigPage from '@/app/client/post-gig/page';
import GigPage from '@/app/gigs/[id]/page';
import ClientGigApplicationsPage from '@/app/client/gigs/[id]/applications/page';
import WorkerApplicationsPage from '@/app/worker/applications/page';
import WorkerProfilePage from '@/app/worker/profile/page';
import ClientProfilePage from '@/app/client/profile/page';
import MessagesPage from '@/app/messages/page';
import ThreadPage from '@/app/messages/[applicationId]/page';
import { SiteNav } from '@/components/site-nav';
import { NotificationBell } from '@/components/notification-bell';
import NotificationsPage from '@/app/notifications/page';
import WorkerDashboardPage from '@/app/worker/dashboard/page';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/platform-store';

const DEMO_AUTH_KEY = 'quickgig-sa-demo-auth';
const STORE_KEY = 'quickgig-sa-demo-store-v2';

function renderWithProviders(ui: ReactNode) {
  return render(
    <Providers>
      <Suspense fallback={null}>{ui}</Suspense>
    </Providers>,
  );
}

/** Next.js hands client pages an already-settled params promise; React's `use()` can read it synchronously. */
function params(id: string): Promise<{ id: string }> {
  const promise = Promise.resolve({ id }) as Promise<{ id: string }> & { status?: string; value?: { id: string } };
  promise.status = 'fulfilled';
  promise.value = { id };
  return promise;
}

/** Signs in through the real login page in demo mode (any password works). */
async function loginAs(email: string) {
  const user = userEvent.setup();
  const view = renderWithProviders(<LoginPage />);
  await user.type(screen.getByLabelText('Email address'), email);
  await user.type(screen.getByLabelText('Password'), 'password');
  await user.click(screen.getByRole('button', { name: 'Login' }));
  await waitFor(() => expect(JSON.parse(window.localStorage.getItem(DEMO_AUTH_KEY) ?? 'null')?.email).toBe(email));
  view.unmount();
}

/** Small probe component so tests can read store state without going through a page. */
function StoreProbe({ onReady }: { onReady: (s: ReturnType<typeof usePlatformStore>, a: ReturnType<typeof useAuth>) => void }) {
  const store = usePlatformStore();
  const auth = useAuth();
  if (!store.loading && !auth.loading) onReady(store, auth);
  return null;
}

beforeEach(() => {
  window.localStorage.clear();
  router.push.mockClear();
  router.replace.mockClear();
});

describe('demo mode: auth', () => {
  it('logs a seeded user in with their seeded role and redirects to the right dashboard', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);
    await user.type(screen.getByLabelText('Email address'), 'nandi@example.com');
    await user.type(screen.getByLabelText('Password'), 'whatever');
    await user.click(screen.getByRole('button', { name: 'Login' }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/client/dashboard'));
  });

  it('registers a new worker only once both consent boxes are ticked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    await user.type(screen.getByLabelText('Full name'), 'Test Worker');
    await user.type(screen.getByLabelText('Email address'), 'new.worker@example.com');
    await user.type(screen.getByLabelText('Phone number'), '0821234567');
    await user.type(screen.getByLabelText('Location'), 'Cape Town');
    await user.type(screen.getByLabelText('Password'), 'StrongPass123!');

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    for (const box of checkboxes) await user.click(box);

    await user.click(screen.getByRole('button', { name: 'Create account' }));
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(DEMO_AUTH_KEY) ?? 'null');
      expect(stored?.email).toBe('new.worker@example.com');
    });
  });
});

describe('demo mode: auth resilience', () => {
  it('still creates the account when localStorage is unavailable (e.g. Safari private mode)', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderWithProviders(<RegisterPage />);
    await user.type(screen.getByLabelText('Full name'), 'Private Mode');
    await user.type(screen.getByLabelText('Email address'), 'private@example.com');
    await user.type(screen.getByLabelText('Phone number'), '0821234567');
    await user.type(screen.getByLabelText('Location'), 'Durban');
    await user.type(screen.getByLabelText('Password'), 'StrongPass123!');
    for (const box of screen.getAllByRole('checkbox')) await user.click(box);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/worker/dashboard'));
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled();

    setItem.mockRestore();
    warn.mockRestore();
  });
});

describe('demo mode: gig lifecycle', () => {
  it('client posts a gig → worker applies → client accepts → worker sees it accepted', async () => {
    const user = userEvent.setup();

    // 1. Client posts a gig.
    await loginAs('nandi@example.com');
    let view = renderWithProviders(<PostGigPage />);
    await screen.findByRole('heading', { name: 'Post a new gig' });
    await user.type(screen.getByLabelText('Gig title'), 'Integration test gig');
    await user.type(screen.getByLabelText('Public location area'), 'Observatory, Cape Town');
    await user.type(screen.getByLabelText('Private address'), '12 Secret Lane');
    await user.type(screen.getByLabelText('Date'), '2026-12-01');
    await user.type(screen.getByLabelText('Start time'), '09:00');
    await user.type(screen.getByLabelText('End time'), '13:00');
    await user.type(screen.getByLabelText('Pay amount (ZAR)'), '350');
    await user.type(screen.getByLabelText('Description'), 'Help pack boxes for a market stall.');
    await user.type(screen.getByLabelText('Requirements'), 'Comfortable shoes.');
    await user.click(screen.getByRole('button', { name: 'Post gig' }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith(expect.stringMatching(/^\/client\/gigs\/.+\/applications$/)));
    const gigId = (router.push.mock.calls.at(-1)![0] as string).split('/')[3]!;
    const persisted = JSON.parse(window.localStorage.getItem(STORE_KEY)!);
    expect(persisted.gigs.find((g: { id: string }) => g.id === gigId)).toMatchObject({ title: 'Integration test gig', status: 'open', pay_amount: 350 });
    view.unmount();

    // 2. Worker applies.
    await loginAs('anele@example.com');
    view = renderWithProviders(<GigPage params={params(gigId)} />);
    await screen.findByRole('heading', { name: 'Integration test gig' });
    await user.click(screen.getByRole('button', { name: 'Apply for this Gig' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Why are you a good fit for this gig?'), 'I live nearby and have event experience.');
    await user.click(within(dialog).getByRole('button', { name: 'Submit Application' }));
    await screen.findByText('Application submitted successfully.');
    view.unmount();

    // 3. Client accepts.
    await loginAs('nandi@example.com');
    view = renderWithProviders(<ClientGigApplicationsPage params={params(gigId)} />);
    await screen.findByRole('heading', { name: 'Integration test gig' });
    expect(await screen.findByText('Anele Mpofu')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /accept/i }));
    await waitFor(() => {
      const apps = JSON.parse(window.localStorage.getItem(STORE_KEY)!).applications as { gig_id: string; status: string }[];
      expect(apps.find((a) => a.gig_id === gigId)?.status).toBe('accepted');
    });
    view.unmount();

    // 4. Worker sees the accepted status.
    await loginAs('anele@example.com');
    renderWithProviders(<WorkerApplicationsPage />);
    const card = (await screen.findByText('Integration test gig')).closest('article')!;
    expect(within(card).getByText(/accepted/i)).toBeInTheDocument();
  });

  it('a worker cannot apply twice to the same gig', async () => {
    const user = userEvent.setup();
    await loginAs('anele@example.com');
    renderWithProviders(<GigPage params={params('gig_1')} />);
    await screen.findByRole('heading', { name: 'Event assistant for food stall' });
    await user.click(screen.getByRole('button', { name: 'Apply for this Gig' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Why are you a good fit for this gig?'), 'First application.');
    await user.click(within(dialog).getByRole('button', { name: 'Submit Application' }));
    await screen.findByText('Application submitted successfully.');

    // The apply button is replaced by the application status, so a second application is impossible.
    expect(await screen.findByText('You applied to this gig')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apply for this Gig' })).not.toBeInTheDocument();
    const apps = JSON.parse(window.localStorage.getItem(STORE_KEY)!).applications as { gig_id: string; worker_id: string }[];
    expect(apps.filter((a) => a.gig_id === 'gig_1' && a.worker_id === 'user_1')).toHaveLength(1);
  });

  it('a client is told to use a worker account instead of being shown the apply dialog', async () => {
    const user = userEvent.setup();
    await loginAs('nandi@example.com');
    renderWithProviders(<GigPage params={params('gig_1')} />);
    await screen.findByRole('heading', { name: 'Event assistant for food stall' });
    await user.click(screen.getByRole('button', { name: 'Apply for this Gig' }));
    expect(await screen.findByText('Please use a worker account to apply for gigs.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('demo mode: messaging', () => {
  function threadParams(applicationId: string): Promise<{ applicationId: string }> {
    const promise = Promise.resolve({ applicationId }) as Promise<{ applicationId: string }> & { status?: string; value?: unknown };
    promise.status = 'fulfilled';
    promise.value = { applicationId };
    return promise;
  }

  it('opens a thread on acceptance; both sides can message; unread counts and read receipts update', async () => {
    const user = userEvent.setup();

    // Seeded: app_1 is Thandi (user_4) pending on gig_1 (Khumalo Eats / nandi). No thread yet.
    await loginAs('thandi@example.com');
    let view = renderWithProviders(<ThreadPage params={threadParams('app_1')} />);
    expect(await screen.findByText('Conversation not available')).toBeInTheDocument();
    view.unmount();

    // Client accepts → thread opens.
    await loginAs('nandi@example.com');
    view = renderWithProviders(<ClientGigApplicationsPage params={params('gig_1')} />);
    const card = (await screen.findByText('Thandi Jacobs')).closest('article')!;
    await user.click(within(card).getByRole('button', { name: /accept/i }));
    expect(await within(card).findByRole('link', { name: /message worker/i })).toHaveAttribute('href', '/messages/app_1');
    view.unmount();

    // Client sends the first message.
    view = renderWithProviders(<ThreadPage params={threadParams('app_1')} />);
    const box = await screen.findByLabelText('Message');
    await user.type(box, 'Hi Thandi, meet at the stall at 09:45 please.');
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    const log = () => within(screen.getByRole('log'));
    expect(await log().findByText('Hi Thandi, meet at the stall at 09:45 please.')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toHaveValue('');
    expect(log().getByLabelText('Sent')).toBeInTheDocument(); // single tick: not yet read
    view.unmount();

    // Worker sees 1 unread in the nav and in the inbox, opens it, replies.
    await loginAs('thandi@example.com');
    view = renderWithProviders(
      <>
        <SiteNav />
        <MessagesPage />
      </>,
    );
    expect(await screen.findByLabelText('1 unread')).toBeInTheDocument();
    const row = await screen.findByRole('link', { name: /Khumalo Eats/ });
    expect(row).toHaveAttribute('href', '/messages/app_1');
    view.unmount();

    view = renderWithProviders(<ThreadPage params={threadParams('app_1')} />);
    expect(await log().findByText('Hi Thandi, meet at the stall at 09:45 please.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Message'), 'Great, see you then!{Enter}'); // Enter sends
    expect(await log().findByText('Great, see you then!')).toBeInTheDocument();
    view.unmount();

    // Back as the client: Thandi's reply + the seeded unread from Anele (msg_2) → 2 unread; the first message now shows as read.
    await loginAs('nandi@example.com');
    view = renderWithProviders(<SiteNav />);
    expect(await screen.findByLabelText('2 unread')).toBeInTheDocument();
    view.unmount();
    renderWithProviders(<ThreadPage params={threadParams('app_1')} />);
    expect(await log().findByText('Great, see you then!')).toBeInTheDocument();
    expect(await log().findByLabelText('Read')).toBeInTheDocument();
  });

  it('a stranger cannot open someone else\'s thread', async () => {
    await loginAs('musa@example.com'); // another client
    renderWithProviders(<ThreadPage params={threadParams('app_2')} />);
    expect(await screen.findByText('Conversation not available')).toBeInTheDocument();
    expect(screen.queryByText(/back entrance on Long Street/)).not.toBeInTheDocument();
  });
});

describe('demo mode: notifications', () => {
  function threadParams(applicationId: string): Promise<{ applicationId: string }> {
    const promise = Promise.resolve({ applicationId }) as Promise<{ applicationId: string }> & { status?: string; value?: unknown };
    promise.status = 'fulfilled';
    promise.value = { applicationId };
    return promise;
  }

  it('apply → client bell; accept → worker bell; message → recipient bell; opening the page clears them', async () => {
    const user = userEvent.setup();

    // Seeded: Nandi already has 2 unread (note_1 new applicant, note_3 message).
    await loginAs('nandi@example.com');
    let view = renderWithProviders(<NotificationBell />);
    expect(await screen.findByLabelText('Notifications, 2 unread')).toBeInTheDocument();
    view.unmount();

    // Thandi (user_4) applies to gig_2 (Nandi's) → Nandi gets a third notification.
    await loginAs('thandi@example.com');
    view = renderWithProviders(<GigPage params={params('gig_2')} />);
    await user.click(await screen.findByRole('button', { name: 'Apply for this Gig' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Why are you a good fit for this gig?'), 'Keen and available.');
    await user.click(within(dialog).getByRole('button', { name: 'Submit Application' }));
    await screen.findByText('Application submitted successfully.');
    view.unmount();

    await loginAs('nandi@example.com');
    view = renderWithProviders(<NotificationBell />);
    expect(await screen.findByLabelText('Notifications, 3 unread')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Notifications, 3 unread'));
    const panel = await screen.findByRole('dialog', { name: 'Notifications' });
    expect(within(panel).getAllByText('New applicant: Thandi Jacobs')).toHaveLength(2); // seeded app_1 + the new one
    view.unmount();

    // Opening the applicants page for gig_2 clears that "new applicant" note; accepting notifies Thandi.
    view = renderWithProviders(
      <>
        <NotificationBell />
        <ClientGigApplicationsPage params={params('gig_2')} />
      </>,
    );
    const card = (await screen.findByText('Thandi Jacobs')).closest('article')!;
    expect(await screen.findByLabelText('Notifications, 2 unread')).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: /accept/i }));
    await within(card).findByRole('link', { name: /message worker/i });
    view.unmount();

    await loginAs('thandi@example.com');
    view = renderWithProviders(<NotificationsPage />);
    expect(await screen.findByText(/You got the gig:/)).toBeInTheDocument();
    view.unmount();

    // Thandi messages Nandi → Nandi's bell goes back up; opening the thread clears it.
    const appId = (JSON.parse(window.localStorage.getItem(STORE_KEY)!).applications as { id: string; gig_id: string; worker_id: string }[]).find(
      (a) => a.gig_id === 'gig_2' && a.worker_id === 'user_4',
    )!.id;
    view = renderWithProviders(<ThreadPage params={threadParams(appId)} />);
    await user.type(await screen.findByLabelText('Message'), 'Thank you! What time?{Enter}');
    await within(screen.getByRole('log')).findByText('Thank you! What time?');
    view.unmount();

    await loginAs('nandi@example.com');
    view = renderWithProviders(<NotificationBell />);
    expect(await screen.findByLabelText('Notifications, 3 unread')).toBeInTheDocument();
    view.unmount();
    renderWithProviders(
      <>
        <NotificationBell />
        <ThreadPage params={threadParams(appId)} />
      </>,
    );
    await within(await screen.findByRole('log')).findByText('Thank you! What time?');
    expect(await screen.findByLabelText('Notifications, 2 unread')).toBeInTheDocument();
  });

  it('"mark all read" clears the badge and the email toggle persists', async () => {
    const user = userEvent.setup();
    await loginAs('nandi@example.com');
    const view = renderWithProviders(
      <>
        <NotificationBell />
        <NotificationsPage />
      </>,
    );
    await user.click(await screen.findByRole('button', { name: /mark all 2 read/i }));
    expect(await screen.findByLabelText('Notifications')).toBeInTheDocument();
    view.unmount();

    renderWithProviders(<ClientProfilePage />);
    const toggle = await screen.findByRole('switch', { name: 'Email notifications' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await user.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'));
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(STORE_KEY)!).emailNotifications).toBe(false));
  });
});

describe('demo mode: reviews and profile strength', () => {
  it('client completes a gig, reviews the worker; worker sees the rating, a notification, and can review back once', async () => {
    const user = userEvent.setup();

    // Seeded app_2: Anele (user_1) accepted on gig_2 (Nandi / Khumalo Eats). Complete it, then review.
    await loginAs('nandi@example.com');
    let view = renderWithProviders(<ClientGigApplicationsPage params={params('gig_2')} />);
    const card = (await screen.findByText('Anele Mpofu')).closest('article')!;
    expect(within(card).queryByRole('button', { name: /review anele/i })).not.toBeInTheDocument(); // not until completed
    await user.click(within(card).getByRole('button', { name: /complete/i }));
    await user.click(await within(card).findByRole('button', { name: /review anele/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Post review' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/pick a star rating/i);
    await user.click(within(dialog).getByRole('radio', { name: /5 stars/i }));
    await user.type(within(dialog).getByLabelText(/comment/i), 'Fast and friendly.');
    await user.click(within(dialog).getByRole('button', { name: 'Post review' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(within(card).getByText('You rated')).toBeInTheDocument(); // button replaced, so no second review
    view.unmount();

    // Worker: notification + review on profile; seeded 5 (review_1) + new 5 = 5.0 from 2 reviews.
    await loginAs('anele@example.com');
    view = renderWithProviders(<NotificationsPage />);
    expect(await screen.findByText(/New 5-star review from Khumalo Eats/)).toBeInTheDocument();
    view.unmount();
    view = renderWithProviders(<WorkerProfilePage />);
    expect(await screen.findByText('Fast and friendly.')).toBeInTheDocument();
    expect(screen.getByText('2 reviews')).toBeInTheDocument();
    expect(screen.getByText('5.0')).toBeInTheDocument();
    view.unmount();

    // Worker reviews the client back from My applications.
    view = renderWithProviders(<WorkerApplicationsPage />);
    const appCard = (await screen.findByText('Delivery runner for quick packages')).closest('article')!;
    await user.click(within(appCard).getByRole('button', { name: /review khumalo/i }));
    const dialog2 = await screen.findByRole('dialog');
    await user.click(within(dialog2).getByRole('radio', { name: /4 stars/i }));
    await user.click(within(dialog2).getByRole('button', { name: 'Post review' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(within(appCard).getByText('You rated')).toBeInTheDocument();
    view.unmount();

    await loginAs('nandi@example.com');
    renderWithProviders(<ClientProfilePage />);
    expect(await screen.findByText('1 review')).toBeInTheDocument();
  });

  it('shows profile strength with what is missing and links to the profile', async () => {
    await loginAs('anele@example.com');
    renderWithProviders(<WorkerDashboardPage />);
    const bar = await screen.findByRole('progressbar', { name: /profile completeness/i });
    const percent = Number(bar.getAttribute('aria-valuenow'));
    expect(percent).toBeGreaterThan(0);
    expect(percent).toBeLessThan(100); // seeded Anele is not verified
    expect(screen.getByText('Verified by QuickGig')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /complete your profile/i })).toHaveAttribute('href', '/worker/profile');
  });
});

describe('demo mode: profile form', () => {
  it('keeps what the user is typing when the store re-renders (regression)', async () => {
    const user = userEvent.setup();
    await loginAs('anele@example.com');

    let store: ReturnType<typeof usePlatformStore> | undefined;
    renderWithProviders(
      <>
        <StoreProbe onReady={(s) => (store = s)} />
        <WorkerProfilePage />
      </>,
    );
    const bio = await screen.findByLabelText('Bio');
    await user.clear(bio);
    await user.type(bio, 'Half-typed bio');

    // Something unrelated changes in the store, which replaces the workerProfiles array identity.
    await act(async () => {
      await store!.updateGigStatus('gig_2', 'closed');
    });

    expect(screen.getByLabelText('Bio')).toHaveValue('Half-typed bio');

    await user.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(await screen.findByText('Profile updated.')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(STORE_KEY) ?? '{}')).toBeTruthy();
  });
});
