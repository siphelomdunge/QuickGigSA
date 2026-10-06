import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Providers } from './providers';
import { SiteNav } from '@/components/site-nav';
import { DemoModeBanner } from '@/components/demo-mode-banner';

export const metadata: Metadata = {
  title: 'QuickGig SA',
  description: 'A South African youth gig marketplace for workers, clients, and admins.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-text antialiased">
        <Providers>
          <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
            <header className="sticky top-3 z-40 mb-8 flex items-center justify-between gap-4 rounded-full border border-white/70 bg-white/75 px-4 py-3 shadow-soft backdrop-blur-xl sm:px-5">
              <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold text-slate-950">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm text-white shadow-glow-blue">
                  QG
                </span>
                <span>QuickGig SA</span>
              </Link>
              <SiteNav />
            </header>

            <main className="flex-1">
              <DemoModeBanner />
              {children}
            </main>

            <footer className="glass-panel mt-12 rounded-[1.5rem] p-6 text-sm text-slate-600 sm:p-8">
              <div className="max-w-5xl space-y-3">
                <p className="font-semibold text-slate-900">QuickGig SA</p>
                <p className="leading-6">
                  QuickGig SA connects clients with independent workers for short-term gigs. Workers are not employees of QuickGig SA. Clients and workers agree directly on work scope, payment, and terms.
                </p>
                <p className="leading-6">
                  QuickGig SA does not guarantee jobs or payment. Use the platform to connect, review applicants, and manage gig progress locally.
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
