'use client';

import Link from 'next/link';
import { CheckCircle2, Lock, Plus, RotateCcw, Users } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/platform-store';

export default function ManageGigsPage() {
  const { user } = useAuth();
  const { gigs, applications, updateGigStatus } = usePlatformStore();
  const clientGigs = user ? gigs.filter((gig) => gig.client_id === user.id) : [];

  return (
    <AuthGate allowedRoles={['client']}>
      <div className="space-y-8">
        <section className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">Client workspace</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Manage gigs</h1>
              <p className="mt-3 text-slate-600">Review active posts, applicants, and completed work.</p>
            </div>
            <Link href="/client/post-gig" className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500">
              <Plus className="h-4 w-4" />
              Post gig
            </Link>
          </div>
        </section>

        <div className="grid gap-5">
          {clientGigs.length ? (
            clientGigs.map((gig) => {
              const applicantCount = applications.filter((application) => application.gig_id === gig.id).length;
              const acceptedCount = applications.filter((application) => application.gig_id === gig.id && application.status === 'accepted').length;
              const completedCount = applications.filter((application) => application.gig_id === gig.id && application.status === 'completed').length;
              const canComplete = acceptedCount > 0 || completedCount > 0;
              return (
                <article key={gig.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-soft">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={gig.status} />
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{gig.category}</span>
                      </div>
                      <p className="text-lg font-semibold text-slate-900">{gig.title}</p>
                      <p className="text-sm text-slate-600">{gig.location_area} • {gig.date} • R{gig.pay_amount}</p>
                      <p className="text-xs text-slate-500">{acceptedCount} accepted • {completedCount} completed</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      <Link href={`/client/gigs/${gig.id}/applications`} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600">
                        <Users className="h-4 w-4" />
                        {applicantCount} application{applicantCount === 1 ? '' : 's'}
                      </Link>
                      <div className="flex flex-wrap gap-2">
                        {gig.status === 'open' ? (
                          <Button variant="outline" onClick={() => updateGigStatus(gig.id, 'closed')} className="gap-2">
                            <Lock className="h-4 w-4" />
                            Close
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={() => updateGigStatus(gig.id, 'open')} disabled={gig.status === 'completed'} className="gap-2">
                            <RotateCcw className="h-4 w-4" />
                            Reopen
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          onClick={() => updateGigStatus(gig.id, 'completed')}
                          disabled={gig.status === 'completed' || !canComplete}
                          className="gap-2"
                          title={!canComplete ? 'Accept at least one worker before completing this gig.' : undefined}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Complete
                        </Button>
                      </div>
                      {!canComplete ? <p className="max-w-xs text-xs text-slate-500">Accept at least one worker before marking the gig completed.</p> : null}
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              title="No gigs posted yet"
              description="Create your first local gig and start receiving applications from nearby workers."
              action={
                <Link href="/client/post-gig" className="rounded-full bg-secondary px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-500">
                  Post a gig
                </Link>
              }
            />
          )}
        </div>
      </div>
    </AuthGate>
  );
}
