'use client';

import { AuthGate } from '@/components/auth-gate';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { usePlatformStore } from '@/lib/platform-store';

export default function AdminApplicationsPage() {
  const { applications, gigs, updateApplicationStatus } = usePlatformStore();

  return (
    <AuthGate allowedRoles={['admin']}>
      <div className="space-y-8">
        <section className="page-hero p-6 sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Applications</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Monitor worker requests and application status across the platform.</p>
        </section>
        <div className="grid gap-5">
          {applications.length ? (
            applications.map((application) => {
              const gig = gigs.find((item) => item.id === application.gig_id);
              return (
                <article key={application.id} className="panel-sm p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{application.gig_title}</p>
                        <StatusBadge status={application.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-600">Applicant: {application.worker_name}</p>
                      <p className="mt-1 text-sm text-slate-500">Gig area: {gig?.location_area ?? 'Unknown'} • Client: {gig?.client_name ?? 'Unknown'}</p>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{application.message}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => updateApplicationStatus(application.id, 'pending')} disabled={application.status === 'pending'}>
                        Pending
                      </Button>
                      <Button variant="secondary" onClick={() => updateApplicationStatus(application.id, 'accepted')} disabled={application.status === 'accepted'}>
                        Accept
                      </Button>
                      <Button variant="outline" onClick={() => updateApplicationStatus(application.id, 'rejected')} disabled={application.status === 'rejected'}>
                        Reject
                      </Button>
                      <Button variant="outline" onClick={() => updateApplicationStatus(application.id, 'completed')} disabled={application.status === 'completed'}>
                        Complete
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState title="No applications yet" description="Worker applications will appear here after workers apply to gigs." />
          )}
        </div>
      </div>
    </AuthGate>
  );
}
