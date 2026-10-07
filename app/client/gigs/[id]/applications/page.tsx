'use client';

import { use } from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, MapPin, Star, X } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { usePlatformStore } from '@/lib/platform-store';

interface ApplicationsPageProps {
  params: Promise<{ id: string }>;
}

export default function ClientGigApplicationsPage({ params }: ApplicationsPageProps) {
  const { id } = use(params);
  const { gigs, applications, users, workerProfiles, updateApplicationStatus } = usePlatformStore();
  const gig = gigs.find((item) => item.id === id);
  const gigApplications = applications.filter((application) => application.gig_id === id);

  if (!gig) {
    return (
      <AuthGate allowedRoles={['client']}>
        <EmptyState title="Gig not found" description="Return to manage gigs to choose another listing." />
      </AuthGate>
    );
  }

  return (
    <AuthGate allowedRoles={['client']}>
      <div className="space-y-8">
        <section className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">Applications</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{gig.title}</h1>
              <p className="mt-3 max-w-2xl text-slate-600">Review applicants and accept or reject each worker request.</p>
            </div>
            <StatusBadge status={gig.status} />
          </div>
        </section>

        <div className="grid gap-5">
          {gigApplications.length ? (
            gigApplications.map((application) => {
              const worker = users.find((user) => user.id === application.worker_id);
              const profile = workerProfiles.find((item) => item.user_id === application.worker_id);
              const skills = profile?.skills ?? [];

              return (
                <article key={application.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-soft">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-slate-900">{profile?.full_name ?? worker?.full_name ?? application.worker_name}</p>
                        <StatusBadge status={application.status} />
                        <StatusBadge status={profile?.verification_status ?? 'unverified'} />
                      </div>

                      <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {profile?.location ?? worker?.location ?? 'Location not provided'}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Star className="h-4 w-4 text-secondary" />
                          {profile ? `${profile.rating.toFixed(1)} rating` : 'New worker'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {skills.length ? (
                          skills.map((skill) => (
                            <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Skills not added</span>
                        )}
                      </div>

                      <div className="rounded-[1.25rem] bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Application message</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{application.message}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
                      <Button variant="secondary" className="gap-2" onClick={() => updateApplicationStatus(application.id, 'accepted')}>
                        <Check className="h-4 w-4" />
                        Accept
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={() => updateApplicationStatus(application.id, 'rejected')}>
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => updateApplicationStatus(application.id, 'completed')}
                        disabled={application.status !== 'accepted' && application.status !== 'completed'}
                        title={application.status !== 'accepted' && application.status !== 'completed' ? 'Accept this worker before marking the application completed.' : undefined}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Complete
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState title="No applications yet" description="Applicants for this gig will appear here as workers apply." />
          )}
        </div>

        <Link href="/client/manage-gigs" className="inline-flex text-sm font-semibold text-primary hover:text-blue-600">
          Back to manage gigs
        </Link>
      </div>
    </AuthGate>
  );
}
