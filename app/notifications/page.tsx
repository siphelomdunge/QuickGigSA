'use client';

import { Bell, CheckCheck } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { NotificationRow } from '@/components/notification-bell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/platform-store';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, markNotificationsRead } = usePlatformStore();
  const mine = user ? notifications.filter((note) => note.user_id === user.id) : [];
  const unread = mine.filter((note) => !note.read_at);

  return (
    <AuthGate allowedRoles={['worker', 'client', 'admin']}>
      <div className="space-y-6">
        <section className="page-hero p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Notifications</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">What&apos;s happened</h1>
              <p className="mt-2 max-w-2xl text-slate-600">New applicants, decisions on your applications, and messages. Emails for these can be switched off in your profile.</p>
            </div>
            {unread.length ? (
              <Button variant="outline" onClick={() => markNotificationsRead(unread.map((note) => note.id)).catch(() => undefined)}>
                <CheckCheck className="h-4 w-4" />
                Mark all {unread.length} read
              </Button>
            ) : null}
          </div>
        </section>

        <section className="grid gap-3">
          {mine.length ? (
            mine.map((note) => <NotificationRow key={note.id} note={note} onOpen={(item) => !item.read_at && markNotificationsRead([item.id]).catch(() => undefined)} />)
          ) : (
            <EmptyState icon={Bell} title="Nothing yet" description="You'll see applicants, decisions and messages here as they happen." />
          )}
        </section>
      </div>
    </AuthGate>
  );
}
