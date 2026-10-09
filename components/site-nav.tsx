'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Menu, X, Zap } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
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
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-xs font-bold text-white" aria-label={`${count} unread`}>
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

/**
 * Full-screen menu rendered at the document root, so it can never be clipped or hidden by the
 * sticky, blurred header it is opened from (which is what broke the old dropdown on some phones).
 */
function MobileSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" aria-label="Close menu" onClick={onClose} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-sm animate-slide-in flex-col overflow-y-auto bg-white p-5 shadow-premium">{children}</div>
    </div>,
    document.body,
  );
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
      'inline-flex min-h-10 items-center rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
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
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                {initials(fullName) || 'QG'}
              </span>
              <span className="max-w-[10rem] truncate font-medium text-slate-700">{fullName}</span>
              {role ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-slate-500">{role}</span> : null}
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

      {/* Mobile: a Login shortcut is always visible so the account is reachable even without opening the menu. */}
      {!user && !loading ? (
        <Link href="/login" className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-glow-blue lg:hidden">
          Login
        </Link>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open ? (
        <MobileSheet onClose={() => setOpen(false)}>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 font-display text-lg font-semibold text-slate-950">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                <Zap className="h-4 w-4 fill-white" />
              </span>
              Menu
            </span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="mt-6 grid gap-1" aria-label="Mobile" id="mobile-menu">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={cn(linkClass(link.href), 'flex items-center justify-between rounded-2xl px-4 py-3.5 text-base')}>
                {link.label}
                {link.href === '/messages' && unread ? <UnreadBadge count={unread} /> : null}
              </Link>
            ))}
            {user ? (
              <Link href="/notifications" onClick={() => setOpen(false)} className={cn(linkClass('/notifications'), 'flex items-center justify-between rounded-2xl px-4 py-3.5 text-base')}>
                Notifications
              </Link>
            ) : null}
          </nav>

          <div className="mt-auto border-t border-slate-200 pt-4">
            {user ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-xs font-bold text-white">
                    {initials(fullName) || 'QG'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{fullName}</p>
                    <p className="text-xs uppercase tracking-wider text-slate-500">{role}</p>
                  </div>
                </div>
                <button
                  disabled={loading}
                  onClick={() => {
                    setOpen(false);
                    signOut();
                  }}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-full border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700">
                  Login
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="rounded-full bg-primary px-4 py-3 text-center text-sm font-semibold text-white shadow-glow-blue">
                  Get started
                </Link>
              </div>
            )}
          </div>
        </MobileSheet>
      ) : null}
    </>
  );
}
