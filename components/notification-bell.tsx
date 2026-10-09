'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, BellRing, CalendarClock, CheckCheck, Inbox, MessageSquare, PartyPopper, Star, UserPlus, XCircle } from 'lucide-react';
import type { Notification, NotificationType } from '@/lib/mock-data';
import { formatRelative } from '@/lib/messaging';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/platform-store';
import { cn } from '@/lib/utils';

export const notificationIcon: Record<NotificationType, { icon: typeof Bell; tone: string }> = {
  new_application: { icon: UserPlus, tone: 'bg-primary-50 text-primary-700' },
  application_accepted: { icon: PartyPopper, tone: 'bg-accent-50 text-accent-700' },
  application_rejected: { icon: XCircle, tone: 'bg-slate-100 text-slate-600' },
  new_message: { icon: MessageSquare, tone: 'bg-secondary-50 text-orange-700' },
  new_review: { icon: Star, tone: 'bg-amber-50 text-amber-700' },
  gig_updated: { icon: CalendarClock, tone: 'bg-primary-50 text-primary-700' },
};

export function NotificationRow({ note, onOpen, compact = false }: { note: Notification; onOpen?: (note: Notification) => void; compact?: boolean }) {
  const { icon: Icon, tone } = notificationIcon[note.type];
  return (
    <Link
      href={note.link}
      onClick={() => onOpen?.(note)}
      className={cn(
        'flex items-start gap-3 rounded-xl p-3 transition hover:bg-slate-50',
        !note.read_at && 'bg-primary-50/50 hover:bg-primary-50',
        !compact && 'border border-slate-200/80 bg-white p-4 shadow-soft hover:-translate-y-0.5 hover:shadow-lift',
        !compact && !note.read_at && 'border-primary-200 bg-primary-50/40',
      )}
    >
      <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tone)}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className={cn('text-sm text-slate-900', note.read_at ? 'font-medium' : 'font-semibold')}>{note.title}</span>
          <span className="shrink-0 text-xs text-slate-400">{formatRelative(note.created_at)}</span>
        </span>
        <span className={cn('mt-0.5 block text-sm leading-5 text-slate-600', compact && 'line-clamp-2')}>{note.body}</span>
      </span>
      {!note.read_at ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-secondary" aria-label="Unread" /> : null}
    </Link>
  );
}

export function NotificationBell() {
  const { user } = useAuth();
  const { notifications, markNotificationsRead } = usePlatformStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // The panel is rendered at the document root (the blurred header would otherwise clip it on phones)
  // and anchored to the bell's position; on narrow screens it simply spans the viewport.
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) setAnchor({ top: rect.bottom + 8, right: Math.max(16, window.innerWidth - rect.right) });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  const mine = user ? notifications.filter((note) => note.user_id === user.id) : [];
  const unread = mine.filter((note) => !note.read_at);
  const recent = mine.slice(0, 6);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unread.length ? `Notifications, ${unread.length} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
      >
        {unread.length ? <BellRing className="h-[18px] w-[18px]" /> : <Bell className="h-[18px] w-[18px]" />}
        {unread.length ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-xs font-bold text-white ring-2 ring-white">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        ) : null}
      </button>

      {open && anchor
        ? createPortal(
            <div
              ref={panelRef}
              style={{ top: anchor.top, right: anchor.right }}
              className="fixed left-4 z-[60] animate-scale-in rounded-2xl border border-slate-200/80 bg-white p-2 shadow-premium sm:left-auto sm:w-[22rem]"
              role="dialog"
              aria-label="Notifications"
            >
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="font-display text-sm font-semibold text-slate-900">Notifications</p>
            {unread.length ? (
              <button
                type="button"
                onClick={() => markNotificationsRead(unread.map((note) => note.id)).catch(() => undefined)}
                className="inline-flex min-h-11 items-center gap-1 px-2 text-xs font-semibold text-primary hover:text-primary-700"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            ) : null}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {recent.length ? (
              <div className="grid gap-0.5">
                {recent.map((note) => (
                  <NotificationRow
                    key={note.id}
                    note={note}
                    compact
                    onOpen={(item) => {
                      setOpen(false);
                      if (!item.read_at) markNotificationsRead([item.id]).catch(() => undefined);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Inbox className="h-6 w-6 text-slate-300" />
                <p className="text-sm font-medium text-slate-700">You&apos;re all caught up</p>
                <p className="text-xs text-slate-500">Applications, decisions and messages will show up here.</p>
              </div>
            )}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="mt-1 block rounded-xl px-3 py-3 text-center text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900">
            View all notifications
          </Link>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
