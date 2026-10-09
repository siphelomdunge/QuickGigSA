'use client';

import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import type { Thread } from '@/lib/messaging';
import { formatRelative } from '@/lib/messaging';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function ThreadList({ threads, userId, activeId }: { threads: Thread[]; userId: string; activeId?: string }) {
  if (!threads.length) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No conversations yet"
        description="A conversation opens automatically when a client accepts an application. Until then, applications are reviewed silently."
      />
    );
  }

  return (
    <ul className="grid min-w-0 gap-2">
      {threads.map((thread) => {
        const last = thread.lastMessage;
        const preview = last ? `${last.sender_id === userId ? 'You: ' : ''}${last.body}` : 'Say hello and confirm the details.';
        const active = thread.application.id === activeId;
        return (
          <li key={thread.application.id} className="min-w-0">
            <Link
              href={`/messages/${thread.application.id}`}
              className={cn(
                'group flex min-w-0 items-center gap-4 rounded-xl border p-4 transition',
                active ? 'border-primary-300 bg-primary-50/60 shadow-soft' : 'border-slate-200/80 bg-white hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lift',
              )}
            >
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                {initials(thread.counterpart?.name ?? 'Q')}
                {thread.unreadCount ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-xs font-bold text-white ring-2 ring-white">
                    {thread.unreadCount}
                  </span>
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className={cn('truncate font-semibold text-slate-900', thread.unreadCount && 'text-primary-800')}>{thread.counterpart?.name}</span>
                  {last ? <span className="shrink-0 text-xs text-slate-400">{formatRelative(last.created_at)}</span> : null}
                </span>
                <span className="mt-0.5 flex items-center gap-2">
                  <span className="truncate text-xs font-medium text-slate-500">{thread.gig?.title ?? thread.application.gig_title}</span>
                  <StatusBadge status={thread.application.status} className="hidden sm:inline-flex" />
                </span>
                <span className={cn('mt-1 block truncate text-sm', thread.unreadCount ? 'font-medium text-slate-800' : 'text-slate-500')}>{preview}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
