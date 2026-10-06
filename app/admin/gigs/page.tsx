'use client';

import Link from 'next/link';
import { AuthGate } from '@/components/auth-gate';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { usePlatformStore } from '@/lib/platform-store';

export default function AdminGigsPage() {
  const { gigs, applications, updateGigStatus } = usePlatformStore();

  return (
    <AuthGate allowedRoles={['admin']}>
      <div className="space-y-8">
        <section className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Gigs</h1>
          <p className="mt-3 max-w-2xl text-slate-600">View every gig posted on the platform and check status details.</p>
        </section>
        <div className="grid gap-5">
          {gigs.length ? (
            gigs.map((gig) => {
              const applicationCount = applications.filter((application) => application.gig_id === gig.id).length;
              return (
                <article key={gig.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-soft">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-slate-900">{gig.title}</p>
                        <StatusBadge status={gig.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{gig.category} • {gig.location_area} • R{gig.pay_amount}</p>
                      <p className="mt-1 text-xs text-slate-500">Client: {gig.client_name} • {applicationCount} application{applicationCount === 1 ? '' : 's'}</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                      <Link href={`/gigs/${gig.id}`} className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-600">
                        Review
                      </Link>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => updateGigStatus(gig.id, 'open')} disabled={gig.status === 'open'}>
                          Open
                        </Button>
                        <Button variant="outline" onClick={() => updateGigStatus(gig.id, 'closed')} disabled={gig.status === 'closed'}>
                          Close
                        </Button>
                        <Button variant="secondary" onClick={() => updateGigStatus(gig.id, 'completed')} disabled={gig.status === 'completed'}>
                          Complete
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState title="No gigs yet" description="Client-posted gigs will appear here." />
          )}
        </div>
      </div>
    </AuthGate>
  );
}
