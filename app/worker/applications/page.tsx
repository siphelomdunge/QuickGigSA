'use client';

import Link from 'next/link';
import { CalendarDays, MapPin, MessageSquare, Wallet } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/platform-store';
import { ReviewButton } from '@/components/review-dialog';
import { canReview } from '@/lib/reviews';

export default function WorkerApplicationsPage() {
  const { user } = useAuth();
  const { applications, gigs } = usePlatformStore();
  const workerApplications = user ? applications.filter((application) => application.worker_id === user.id) : [];

  return (
    <AuthGate allowedRoles={['worker']}>
      <div className="space-y-8">
        <section className="page-hero p-6 sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My applications</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Track every gig you have applied for and watch the status change as clients review applications.</p>
        </section>

        <div className="grid gap-5">
          {workerApplications.length ? (
            workerApplications.map((application) => {
              const gig = gigs.find((item) => item.id === application.gig_id);
              return (
                <article key={application.id} className="panel-sm p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-slate-900">{gig?.title ?? application.gig_title}</p>
                        <StatusBadge status={application.status} />
                      </div>
                      <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {gig?.location_area ?? 'Location unavailable'}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-primary" />
                          {gig?.date ?? 'Date unavailable'}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-primary" />
                          {gig ? `R${gig.pay_amount}` : 'Pay unavailable'}
                        </span>
                      </div>
                      <p className="max-w-3xl text-sm leading-6 text-slate-500">{application.message}</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                      {application.status === 'accepted' || application.status === 'completed' ? (
                        <Link
                          href={`/messages/${application.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-secondary-500 to-secondary-600 px-4 py-2 text-sm font-semibold text-white shadow-glow-orange ring-1 ring-inset ring-white/20 transition hover:shadow-lift"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Message client
                        </Link>
                      ) : null}
                      <Link href={`/gigs/${application.gig_id}`} className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                        View gig
                      </Link>
                      {gig && canReview(application) ? <ReviewButton gigId={gig.id} gigTitle={gig.title} userId={gig.client_id} userName={gig.client_name} /> : null}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              title="No applications yet"
              description="Browse local gigs and submit your first application when you find a good match."
              action={
                <Link href="/browse" className="rounded-full bg-gradient-to-b from-secondary-500 to-secondary-600 px-5 py-3 text-sm font-semibold text-white shadow-glow-orange ring-1 ring-inset ring-white/20 transition hover:shadow-lift">
                  Browse gigs
                </Link>
              }
            />
          )}
        </div>
      </div>
    </AuthGate>
  );
}
