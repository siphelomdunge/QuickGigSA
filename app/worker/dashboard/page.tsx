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

  return (
    <AuthGate allowedRoles={['worker']}>
      <div className="space-y-8">
        <section className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">Worker dashboard</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Find work and track applications</h1>
            </div>
            <Link href="/browse" className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600">
              Browse gigs
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard label="Open gigs" value={openGigs.length} icon={Briefcase} />
            <StatCard label="Your applications" value={workerApplications.length} icon={Clock3} />
            <StatCard label="Accepted" value={accepted} icon={CheckCircle2} />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <section className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
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
                  <div key={app.id} className="rounded-[1.25rem] border border-slate-200 p-4">
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

          <aside className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-900">Worker summary</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Complete your profile, keep your location current, and use clear application messages to stand out.</p>
            <Link href="/worker/profile" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-secondary px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-500">
              Edit profile
            </Link>
          </aside>
        </div>
      </div>
    </AuthGate>
  );
}
