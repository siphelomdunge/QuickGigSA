'use client';

import Link from 'next/link';
import { ClipboardList, Plus, Users, Wallet } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/platform-store';

export default function ClientDashboardPage() {
  const { user } = useAuth();
  const { gigs, applications } = usePlatformStore();
  const clientGigs = user ? gigs.filter((gig) => gig.client_id === user.id) : [];
  const clientGigIds = new Set(clientGigs.map((gig) => gig.id));
  const applicantCount = applications.filter((application) => clientGigIds.has(application.gig_id)).length;
  const openGigs = clientGigs.filter((gig) => gig.status === 'open');
  const totalPostedValue = clientGigs.reduce((sum, gig) => sum + gig.pay_amount * gig.workers_needed, 0);

  return (
    <AuthGate allowedRoles={['client']}>
      <div className="space-y-8">
        <section className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">Client dashboard</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Manage your local gigs</h1>
            </div>
            <Link href="/client/post-gig" className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500">
              <Plus className="h-4 w-4" />
              Post a gig
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <StatCard label="Active gigs" value={openGigs.length} icon={ClipboardList} />
            <StatCard label="Applicants" value={applicantCount} icon={Users} />
            <StatCard label="Posted value" value={`R${totalPostedValue}`} icon={Wallet} />
          </div>
        </section>

        <section className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Recent gig activity</h2>
              <p className="text-slate-600">Review posts and applicant queues.</p>
            </div>
            <Link href="/client/manage-gigs" className="text-sm font-semibold text-primary hover:text-blue-600">
              View all
            </Link>
          </div>
          <div className="mt-5 grid gap-4">
            {clientGigs.slice(0, 4).length ? (
              clientGigs.slice(0, 4).map((gig) => (
                <article key={gig.id} className="rounded-[1.25rem] border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{gig.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{gig.location_area} • {gig.date}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusBadge status={gig.status} />
                      <Link href={`/client/gigs/${gig.id}/applications`} className="text-sm font-semibold text-primary hover:text-blue-600">
                        Applications
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="No gigs yet" description="Post a gig to start receiving applications from workers nearby." />
            )}
          </div>
        </section>
      </div>
    </AuthGate>
  );
}
