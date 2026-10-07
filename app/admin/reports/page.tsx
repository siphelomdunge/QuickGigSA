'use client';

import { AlertTriangle, Briefcase, UserRound } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { usePlatformStore } from '@/lib/platform-store';

export default function AdminReportsPage() {
  const { reports, users, gigs, updateReportStatus } = usePlatformStore();

  return (
    <AuthGate allowedRoles={['admin']}>
      <div className="space-y-8">
        <section className="page-hero p-6 sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Reports</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Review safety reports and track whether they are open, investigating, or resolved.</p>
        </section>

        <div className="grid gap-5">
          {reports.length ? (
            reports.map((report) => {
              const reporter = users.find((user) => user.id === report.reported_by);
              const reportedUser = users.find((user) => user.id === report.reported_user_id);
              const gig = gigs.find((item) => item.id === report.gig_id);

              return (
                <article key={report.id} className="panel-sm p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-secondary" />
                        <p className="text-lg font-semibold text-slate-900">{report.reason}</p>
                        <StatusBadge status={report.status} />
                      </div>
                      <p className="max-w-3xl text-sm leading-6 text-slate-600">{report.description || 'No extra description provided.'}</p>
                      <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                        <span className="inline-flex items-center gap-2">
                          <UserRound className="h-4 w-4 text-primary" />
                          Reporter: {reporter?.full_name ?? 'Unknown'}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <UserRound className="h-4 w-4 text-primary" />
                          Reported: {reportedUser?.full_name ?? 'N/A'}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" />
                          Gig: {gig?.title ?? 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Submitted {new Date(report.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                      <Button variant="outline" onClick={() => updateReportStatus(report.id, 'investigating')} disabled={report.status === 'investigating'}>
                        Investigating
                      </Button>
                      <Button variant="secondary" onClick={() => updateReportStatus(report.id, 'resolved')} disabled={report.status === 'resolved'}>
                        Resolve
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState title="No reports yet" description="Reports submitted by users will appear here." />
          )}
        </div>
      </div>
    </AuthGate>
  );
}
