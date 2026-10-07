import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { Providers } from './providers';
import { SiteNav } from '@/components/site-nav';
import { DemoModeBanner } from '@/components/demo-mode-banner';

export const metadata: Metadata = {
  title: { default: 'QuickGig SA', template: '%s · QuickGig SA' },
  description: 'A South African youth gig marketplace for workers, clients, and admins.',
};

export const viewport: Viewport = {
  themeColor: '#2563EB',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-text antialiased">
        {/* Ambient background: soft colour orbs + a faint grid, fixed behind everything. */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-grid-slate [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_60%)] opacity-70" />
          <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-primary-200/40 blur-3xl" />
          <div className="absolute -right-40 top-1/4 h-[28rem] w-[28rem] rounded-full bg-secondary-100/60 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-accent-100/50 blur-3xl" />
        </div>

        <Providers>
          <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
            <header className="sticky top-3 z-40 mb-8">
              <div className="relative flex items-center justify-between gap-4 rounded-full border border-white/70 bg-white/80 py-2.5 pl-3 pr-3 shadow-card backdrop-blur-xl">
                <Link href="/" className="group inline-flex items-center gap-2.5 text-lg font-semibold text-slate-950">
                  <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 text-white shadow-glow-blue ring-1 ring-inset ring-white/30 transition group-hover:scale-105">
                    <Zap className="h-4 w-4 fill-white" />
                  </span>
                  <span className="font-display tracking-tight">
                    QuickGig <span className="text-gradient">SA</span>
                  </span>
                </Link>
                <SiteNav />
              </div>
            </header>

            <main className="flex-1">
              <DemoModeBanner />
              {children}
            </main>

            <footer className="mt-16 rounded-3xl border border-slate-200/80 bg-white/70 p-6 text-sm text-slate-600 shadow-soft backdrop-blur-xl sm:p-8">
              <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
                <div className="max-w-md space-y-3">
                  <p className="inline-flex items-center gap-2 font-display text-base font-semibold text-slate-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white">
                      <Zap className="h-3.5 w-3.5 fill-white" />
                    </span>
                    QuickGig SA
                  </p>
                  <p className="leading-6">
                    Connecting South African youth with short-term local work. Workers are independent, not employees of QuickGig SA; clients and workers agree
                    directly on scope, payment and terms.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Explore</p>
                  <ul className="mt-3 space-y-2 font-medium text-slate-700">
                    <li><Link href="/browse" className="hover:text-primary">Browse gigs</Link></li>
                    <li><Link href="/register" className="hover:text-primary">Join as a worker</Link></li>
                    <li><Link href="/client/post-gig" className="hover:text-primary">Post a gig</Link></li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Legal</p>
                  <ul className="mt-3 space-y-2 font-medium text-slate-700">
                    <li><Link href="/terms" className="hover:text-primary">Terms of Use</Link></li>
                    <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-2 border-t border-slate-200/80 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
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
