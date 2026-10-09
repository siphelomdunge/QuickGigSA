'use client';

import { use, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, MapPin, MessageSquare, Pencil, Star, X } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { usePlatformStore } from '@/lib/platform-store';
import { RatingInline } from '@/components/reviews-section';
import { ReviewButton } from '@/components/review-dialog';
import { canReview } from '@/lib/reviews';
import { workerCompleteness } from '@/lib/profile-completeness';

interface ApplicationsPageProps {
  params: Promise<{ id: string }>;
}

export default function ClientGigApplicationsPage({ params }: ApplicationsPageProps) {
  const { id } = use(params);
  const { gigs, applications, users, workerProfiles, notifications, updateApplicationStatus, markNotificationsRead } = usePlatformStore();

  // Opening the applicants list clears "new application" notifications for this gig.
  const gigApplicationIds = useMemo(() => new Set(applications.filter((application) => application.gig_id === id).map((application) => application.id)), [applications, id]);
  const unreadNoteKey = notifications
    .filter((note) => note.type === 'new_application' && !note.read_at && note.application_id && gigApplicationIds.has(note.application_id))
    .map((note) => note.id)
    .join(',');
  useEffect(() => {
    if (!unreadNoteKey) return;
    markNotificationsRead(unreadNoteKey.split(',')).catch(() => undefined);
  }, [markNotificationsRead, unreadNoteKey]);
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
        <section className="page-hero p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="eyebrow">Applications</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">{gig.title}</h1>
              <p className="mt-3 max-w-2xl text-slate-600">Review applicants and accept or reject each worker request.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={gig.status} />
              {gig.status === 'completed' || gig.status === 'cancelled' ? null : (
                <Link href={`/client/gigs/${gig.id}/edit`} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                  <Pencil className="h-4 w-4" />
                  Edit gig
                </Link>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-5">
          {gigApplications.length ? (
            gigApplications.map((application) => {
              const worker = users.find((user) => user.id === application.worker_id);
              const profile = workerProfiles.find((item) => item.user_id === application.worker_id);
              const skills = profile?.skills ?? [];

              return (
                <article key={application.id} className="panel-sm p-5">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-slate-900">{profile?.full_name ?? worker?.full_name ?? application.worker_name}</p>
                        <StatusBadge status={application.status} />
                        <StatusBadge status={profile?.verification_status ?? 'unverified'} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <RatingInline userId={application.worker_id} />
                        <span className="text-xs font-medium text-slate-500">Profile {workerCompleteness(profile).percent}% complete</span>
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
                      {application.status === 'accepted' || application.status === 'completed' ? (
                        <Link
                          href={`/messages/${application.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-primary-500 to-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-glow-blue ring-1 ring-inset ring-white/20 transition hover:shadow-lift"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Message worker
                        </Link>
                      ) : null}
                      {application.status === 'pending' ? (
                        <>
                          <Button variant="secondary" className="gap-2" onClick={() => updateApplicationStatus(application.id, 'accepted')}>
                            <Check className="h-4 w-4" />
                            Accept
                          </Button>
                          <Button variant="outline" className="gap-2" onClick={() => updateApplicationStatus(application.id, 'rejected')}>
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      ) : null}
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
                      {canReview(application) ? (
                        <ReviewButton gigId={application.gig_id} gigTitle={gig.title} userId={application.worker_id} userName={profile?.full_name ?? worker?.full_name ?? application.worker_name} size="md" />
                      ) : null}
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
