'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/platform-store';
import { countUnread } from '@/lib/messaging';
import { cn } from '@/lib/utils';

type NavLink = { href: string; label: string };

const roleLinks: Record<string, NavLink[]> = {
  worker: [
    { href: '/worker/dashboard', label: 'Dashboard' },
    { href: '/worker/applications', label: 'My applications' },
    { href: '/messages', label: 'Messages' },
    { href: '/worker/profile', label: 'Profile' },
  ],
  client: [
    { href: '/client/dashboard', label: 'Dashboard' },
    { href: '/client/post-gig', label: 'Post gig' },
    { href: '/client/manage-gigs', label: 'Manage gigs' },
    { href: '/messages', label: 'Messages' },
    { href: '/client/profile', label: 'Business profile' },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Admin' },
    { href: '/admin/verification', label: 'Verification' },
    { href: '/admin/reports', label: 'Reports' },
  ],
};

function UnreadBadge({ count }: { count: number }) {
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-bold text-white" aria-label={`${count} unread`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function SiteNav() {
  const { user, role, signOut, loading } = useAuth();
  const pathname = usePathname();
  const { applications, gigs, users, messages } = usePlatformStore();
  const unread = user ? countUnread({ userId: user.id, applications, gigs, users, messages }) : 0;
  const [open, setOpen] = useState(false);
  // Close the mobile menu when the route changes (derived state reset, no effect needed).
  const [openedOn, setOpenedOn] = useState(pathname);
  if (openedOn !== pathname) {
    setOpenedOn(pathname);
    setOpen(false);
  }

  const links: NavLink[] = [{ href: '/browse', label: 'Browse gigs' }, ...(role ? roleLinks[role] ?? [] : [])];
  const fullName = (user?.user_metadata as { full_name?: string } | undefined)?.full_name ?? user?.email ?? '';

  const linkClass = (href: string) =>
    cn(
      'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
      pathname === href || pathname.startsWith(`${href}/`) ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    );

  return (
    <>
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={cn(linkClass(link.href), 'inline-flex items-center gap-1.5')}>
            {link.label}
            {link.href === '/messages' && unread ? <UnreadBadge count={unread} /> : null}
          </Link>
        ))}
        <span className="mx-2 h-6 w-px bg-slate-200" />
        {user ? (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm shadow-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-[11px] font-bold text-white">
                {initials(fullName) || 'QG'}
              </span>
              <span className="max-w-[10rem] truncate font-medium text-slate-700">{fullName}</span>
              {role ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{role}</span> : null}
            </span>
            <button
              disabled={loading}
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-gradient-to-b from-primary-500 to-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-glow-blue ring-1 ring-inset ring-white/20 transition hover:shadow-lift"
            >
              Get started
            </Link>
          </div>
        )}
      </nav>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 animate-scale-in rounded-3xl border border-slate-200/80 bg-white p-3 shadow-premium lg:hidden">
          <nav className="grid gap-1" aria-label="Mobile">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={cn(linkClass(link.href), 'flex items-center justify-between px-4 py-3 text-base')}>
                {link.label}
                {link.href === '/messages' && unread ? <UnreadBadge count={unread} /> : null}
              </Link>
            ))}
          </nav>
          <div className="mt-3 border-t border-slate-100 pt-3">
            {user ? (
              <div className="flex items-center justify-between gap-3 px-2">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                    {initials(fullName) || 'QG'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{fullName}</p>
                    <p className="text-xs uppercase tracking-wider text-slate-500">{role}</p>
                  </div>
                </div>
                <button disabled={loading} onClick={signOut} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" className="rounded-full border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                  Login
                </Link>
                <Link href="/register" className="rounded-full bg-primary px-4 py-3 text-center text-sm font-semibold text-white shadow-glow-blue">
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
