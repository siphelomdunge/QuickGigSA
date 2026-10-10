import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { Providers } from './providers';
import { SiteNav } from '@/components/site-nav';
import { NotificationBell } from '@/components/notification-bell';
import { ThemeToggle } from '@/components/theme-toggle';
import { DemoModeBanner } from '@/components/demo-mode-banner';

export const metadata: Metadata = {
  title: { default: 'QuickGig SA', template: '%s · QuickGig SA' },
  description: 'A South African youth gig marketplace for workers, clients, and admins.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563EB' },
    { media: '(prefers-color-scheme: dark)', color: '#080D1A' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-text antialiased">
        {/* Ambient background: soft colour orbs + a faint grid, fixed behind everything. */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_60%)] opacity-70" />
          <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-primary-200/40 blur-3xl dark:bg-primary-600/10" />
          <div className="absolute -right-40 top-1/4 h-[28rem] w-[28rem] rounded-full bg-secondary-100/60 blur-3xl dark:bg-secondary-500/10" />
          <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-accent-100/50 blur-3xl dark:bg-accent-500/10" />
        </div>

        <Providers>
          <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
            <header className="sticky top-3 z-40 mb-8 before:pointer-events-none before:absolute before:inset-x-[-1rem] before:-top-3 before:h-[calc(100%+0.75rem)] before:bg-gradient-to-b before:from-background before:via-background/90 before:to-transparent sm:before:inset-x-[-1.5rem]">
              <div className="relative flex items-center justify-between gap-4 rounded-full border border-slate-200/70 bg-white/80 py-2 pl-3 pr-2 shadow-card backdrop-blur-xl">
                <Link href="/" className="group inline-flex items-center gap-2.5 text-lg font-semibold text-slate-950">
                  <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 text-white shadow-glow-blue ring-1 ring-inset ring-white/30 transition group-hover:scale-105">
                    <Zap className="h-4 w-4 fill-white" />
                  </span>
                  <span className="font-display tracking-tight">
                    QuickGig <span className="text-gradient">SA</span>
                  </span>
                </Link>
                <div className="flex items-center gap-2">
                  <ThemeToggle className="hidden sm:inline-flex" />
                  <NotificationBell />
                  <SiteNav />
                </div>
              </div>
            </header>

            <main className="flex-1">
              <DemoModeBanner />
              {children}
            </main>

            <footer className="mt-10 rounded-3xl border border-slate-200/80 bg-white/70 p-5 text-sm text-slate-600 shadow-soft backdrop-blur-xl sm:mt-16 sm:p-8">
              <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
                <div className="col-span-2 max-w-md space-y-2 md:col-span-1 md:space-y-3">
                  <p className="inline-flex items-center gap-2 font-display text-base font-semibold text-slate-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white">
                      <Zap className="h-3.5 w-3.5 fill-white" />
                    </span>
                    QuickGig SA
                  </p>
                  <p className="text-xs leading-5 sm:text-sm sm:leading-6">
                    Connecting South African youth with short-term local work. Workers are independent, not employees of QuickGig SA; clients and workers agree
                    directly on scope, payment and terms.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Explore</p>
                  <ul className="mt-1 font-medium text-slate-700">
                    <li><Link href="/browse" className="inline-flex min-h-10 items-center hover:text-primary sm:min-h-11">Browse gigs</Link></li>
                    <li><Link href="/register" className="inline-flex min-h-10 items-center hover:text-primary sm:min-h-11">Join as a worker</Link></li>
                    <li><Link href="/client/post-gig" className="inline-flex min-h-10 items-center hover:text-primary sm:min-h-11">Post a gig</Link></li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Legal</p>
                  <ul className="mt-1 font-medium text-slate-700">
                    <li><Link href="/terms" className="inline-flex min-h-10 items-center hover:text-primary sm:min-h-11">Terms of Use</Link></li>
                    <li><Link href="/privacy" className="inline-flex min-h-10 items-center hover:text-primary sm:min-h-11">Privacy Policy</Link></li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-1 border-t border-slate-200/80 pt-4 text-xs text-slate-500 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
                <p>© {new Date().getFullYear()} QuickGig SA. QuickGig SA does not guarantee jobs or payment.</p>
                <p>Made in Mzansi 🇿🇦</p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
