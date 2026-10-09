'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { GigForm } from '@/components/gig-form';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/platform-store';

export default function EditGigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { gigs, applications, updateGig, loading } = usePlatformStore();
  const [saved, setSaved] = useState(false);

  const gig = gigs.find((item) => item.id === id);
  const mine = Boolean(gig && user && gig.client_id === user.id);
  const editable = Boolean(gig && gig.status !== 'completed' && gig.status !== 'cancelled');
  const affected = applications.filter((application) => application.gig_id === id && (application.status === 'pending' || application.status === 'accepted')).length;

  return (
    <AuthGate allowedRoles={['client', 'admin']}>
      <div className="space-y-6">
        <Link href="/client/manage-gigs" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Manage gigs
        </Link>

        {!gig || loading ? (
          <section className="panel p-6">
            <EmptyState title={loading ? 'Loading…' : 'Gig not found'} description={loading ? '' : 'It may have been removed.'} />
          </section>
        ) : !mine && user?.user_metadata?.role !== 'admin' ? (
          <section className="panel p-6">
            <EmptyState title="Not your gig" description="You can only edit gigs you posted." />
          </section>
        ) : (
          <>
            <section className="page-hero p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">Edit gig</p>
                  <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">{gig.title}</h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <StatusBadge status={gig.status} />
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                      <Users className="h-4 w-4" />
                      {affected} applicant{affected === 1 ? '' : 's'} will be notified if the date, time, area or pay changes
                    </span>
                  </div>
                </div>
                <Link href={`/client/gigs/${gig.id}/applications`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                  View applicants
                </Link>
              </div>
            </section>

            {editable ? (
              <GigForm
                key={gig.id}
                initial={gig}
                submitLabel="Save changes"
                footerNote="Workers who already applied see the updated details and get a notification for changes to when, where and pay."
                onSubmit={async (values) => {
                  await updateGig(gig.id, values);
                  setSaved(true);
                  router.push(`/client/gigs/${gig.id}/applications`);
                }}
              />
            ) : (
              <section className="panel p-6">
                <EmptyState title="This gig can't be edited" description={`It is ${gig.status}. Post a new gig if the plan has changed.`} />
              </section>
            )}
            {saved ? <p className="text-sm font-medium text-accent-700">Changes saved.</p> : null}
          </>
        )}
      </div>
    </AuthGate>
  );
}
