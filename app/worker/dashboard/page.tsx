'use client';

import Link from 'next/link';
import { Briefcase, CheckCircle2, Clock3 } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/platform-store';

export default function WorkerDashboardPage() {
  const { user } = useAuth();
  const { gigs, applications } = usePlatformStore();
  const workerApplications = user ? applications.filter((app) => app.worker_id === user.id) : [];
  const openGigs = gigs.filter((gig) => gig.status === 'open');
  const accepted = workerApplications.filter((app) => app.status === 'accepted').length;
  const firstName = ((user?.user_metadata as { full_name?: string } | undefined)?.full_name ?? user?.email ?? 'there').split(/[\s@]/)[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <AuthGate allowedRoles={['worker']}>
      <div className="space-y-8">
        <section className="page-hero p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Worker dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                {greeting}, {firstName} 👋
              </h1>
              <p className="mt-2 text-slate-600">
                {openGigs.length ? `${openGigs.length} open gig${openGigs.length === 1 ? '' : 's'} waiting for applicants right now.` : 'No open gigs right now. Check back soon.'}
              </p>
            </div>
            <Link href="/browse" className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-primary-500 to-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-glow-blue ring-1 ring-inset ring-white/20 transition hover:shadow-lift">
              Browse gigs
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard label="Open gigs" value={openGigs.length} icon={Briefcase} tone="green" />
            <StatCard label="Your applications" value={workerApplications.length} icon={Clock3} tone="orange" />
            <StatCard label="Accepted" value={accepted} icon={CheckCircle2} tone="blue" />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <section className="panel p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Recent applications</h2>
                <p className="text-slate-600">Your latest gig requests and outcomes.</p>
              </div>
              <Link href="/worker/applications" className="text-sm font-semibold text-primary hover:text-blue-600">
                View all
              </Link>
            </div>
            <div className="mt-5 grid gap-4">
              {workerApplications.slice(0, 4).length ? (
                workerApplications.slice(0, 4).map((app) => (
                  <div key={app.id} className="panel-sm p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{app.gig_title}</p>
                        <p className="mt-1 text-sm text-slate-600">{app.message}</p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No applications yet" description="Browse open gigs and apply when the fit looks right." />
              )}
            </div>
          </section>

          <aside className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white shadow-premium sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary-500/30 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-secondary-500/30 blur-2xl" />
            <h2 className="relative text-2xl font-semibold">Stand out to clients</h2>
            <ul className="relative mt-4 space-y-2.5 text-sm leading-6 text-white/80">
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent-500" />Complete your profile and list real skills.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent-500" />Keep your location current for nearby gigs.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-accent-500" />Write short, specific application messages.</li>
            </ul>
            <Link href="/worker/profile" className="relative mt-6 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5">
              Edit profile
            </Link>
          </aside>
        </div>
      </div>
    </AuthGate>
  );
}
