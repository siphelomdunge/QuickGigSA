'use client';

import { Check, MapPin, Star, X } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { usePlatformStore } from '@/lib/platform-store';

export default function AdminVerificationPage() {
  const { workerProfiles, clientProfiles, updateVerificationStatus } = usePlatformStore();
  const pendingWorkers = workerProfiles.filter((profile) => profile.verification_status === 'pending');
  const pendingClients = clientProfiles.filter((profile) => profile.verification_status === 'pending');
  const pendingProfiles = [
    ...pendingWorkers.map((profile) => ({ type: 'worker' as const, profile })),
    ...pendingClients.map((profile) => ({ type: 'client' as const, profile })),
  ];

  return (
    <AuthGate allowedRoles={['admin']}>
      <div className="space-y-8">
        <section className="page-hero p-6 sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Verification queue</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Review worker and client profiles before marking them verified.</p>
        </section>

        <div className="grid gap-5">
          {pendingProfiles.length ? (
            pendingProfiles.map(({ type, profile }) => {
              const isWorker = type === 'worker';
              const title = isWorker ? profile.full_name : profile.business_name;
              const description = isWorker ? profile.bio || profile.experience : profile.description;
              const tags = isWorker ? profile.skills : [profile.business_type].filter(Boolean);

              return (
                <article key={`${type}-${profile.id}`} className="panel-sm p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-slate-900">{title}</p>
                        <StatusBadge status={type} />
                        <StatusBadge status={profile.verification_status} />
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                        {'location' in profile ? (
                          <span className="inline-flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            {profile.location || 'No location'}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-2">
                          <Star className="h-4 w-4 text-secondary" />
                          {profile.rating.toFixed(1)} rating
                        </span>
                      </div>
                      {description ? <p className="max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
                      <div className="flex flex-wrap gap-2">
                        {tags.length ? (
                          tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">No details added</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                      <Button variant="secondary" className="gap-2" onClick={() => updateVerificationStatus(type, profile.id, 'verified')}>
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={() => updateVerificationStatus(type, profile.id, 'unverified')}>
                        <X className="h-4 w-4" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState title="No verification requests" description="Pending worker and client profiles will appear here." />
          )}
        </div>
      </div>
    </AuthGate>
  );
}
