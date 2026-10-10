'use client';

import { MessageSquare } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { ThreadList } from '@/components/thread-list';
import { useAuth } from '@/lib/auth';
import { buildThreads } from '@/lib/messaging';
import { usePlatformStore } from '@/lib/platform-store';

export default function MessagesPage() {
  const { user } = useAuth();
  const { applications, gigs, users, messages } = usePlatformStore();
  const threads = user ? buildThreads({ userId: user.id, applications, gigs, users, messages }) : [];
  const unread = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);

  return (
    <AuthGate allowedRoles={['worker', 'client']}>
      <div className="space-y-6">
        <section className="page-hero p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Messages</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Your conversations</h1>
              <p className="mt-2 max-w-2xl text-slate-600">One thread per accepted gig, so details stay in one place. Clients and workers only.</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 shadow-soft backdrop-blur">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                <MessageSquare className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-2xl font-semibold leading-none text-slate-900">{unread}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">unread</p>
              </div>
            </div>
          </div>
        </section>

        <section className="panel min-w-0 overflow-hidden p-4 sm:p-6">{user ? <ThreadList threads={threads} userId={user.id} /> : null}</section>
      </div>
    </AuthGate>
  );
}
