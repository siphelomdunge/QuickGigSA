import type { Application, Gig, Message, User } from '@/lib/mock-data';

export interface Thread {
  application: Application;
  gig: Gig | undefined;
  /** The person on the other side of the conversation. */
  counterpart: { id: string; name: string } | undefined;
  lastMessage: Message | undefined;
  unreadCount: number;
}

/** Threads visible to `userId`: every accepted/completed application where they are the worker or the gig owner. */
export function buildThreads({
  userId,
  applications,
  gigs,
  users,
  messages,
}: {
  userId: string;
  applications: Application[];
  gigs: Gig[];
  users: User[];
  messages: Message[];
}): Thread[] {
  const gigsById = new Map(gigs.map((gig) => [gig.id, gig]));
  const usersById = new Map(users.map((user) => [user.id, user]));

  return applications
    .filter((application) => application.status === 'accepted' || application.status === 'completed')
    .map((application) => {
      const gig = gigsById.get(application.gig_id);
      const isWorker = application.worker_id === userId;
      const isClient = gig?.client_id === userId;
      if (!isWorker && !isClient) return null;

      const counterpartId = isWorker ? gig?.client_id : application.worker_id;
      const counterpartName = isWorker ? gig?.client_name ?? usersById.get(counterpartId ?? '')?.full_name : application.worker_name;
      const thread = messages.filter((message) => message.application_id === application.id);

      return {
        application,
        gig,
        counterpart: counterpartId ? { id: counterpartId, name: counterpartName ?? 'QuickGig user' } : undefined,
        lastMessage: thread.at(-1),
        unreadCount: thread.filter((message) => message.sender_id !== userId && !message.read_at).length,
      } satisfies Thread;
    })
    .filter((thread): thread is Thread => thread !== null)
    .sort((a, b) => {
      const aTime = a.lastMessage?.created_at ?? a.application.updated_at;
      const bTime = b.lastMessage?.created_at ?? b.application.updated_at;
      return bTime.localeCompare(aTime);
    });
}

export function countUnread(args: Parameters<typeof buildThreads>[0]): number {
  return buildThreads(args).reduce((sum, thread) => sum + thread.unreadCount, 0);
}

/** "Just now", "5 min", "Yesterday 14:02", "2 Jun" — compact, for inbox rows. */
export function formatRelative(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min`;
  const sameDay = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return time;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday ${time}`;
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

/** Group messages by calendar day for separators in the thread view. */
export function groupByDay(messages: Message[]): { day: string; label: string; messages: Message[] }[] {
  const groups = new Map<string, Message[]>();
  for (const message of messages) {
    const day = new Date(message.created_at).toDateString();
    groups.set(day, [...(groups.get(day) ?? []), message]);
  }
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  return [...groups.entries()].map(([day, items]) => ({
    day,
    label: day === today ? 'Today' : day === yesterday ? 'Yesterday' : new Date(day).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' }),
    messages: items,
  }));
}
