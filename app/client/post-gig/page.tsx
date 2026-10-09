'use client';

import { useRouter } from 'next/navigation';
import { BriefcaseBusiness, MapPin, Wallet } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { GigForm } from '@/components/gig-form';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/platform-store';

export default function PostGigPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { createGig } = usePlatformStore();

  return (
    <AuthGate allowedRoles={['client']}>
      <div className="space-y-8">
        <section className="page-hero p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="eyebrow">Client tools</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Post a new gig</h1>
              <p className="mt-3 max-w-2xl text-slate-600">Create a clear short-term job post for local independent workers.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <BriefcaseBusiness className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-2 text-xs font-semibold text-slate-600">Scope</p>
              </div>
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <Wallet className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-2 text-xs font-semibold text-slate-600">Pay</p>
              </div>
              <div className="rounded-[1.25rem] bg-slate-50 p-4">
                <MapPin className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-2 text-xs font-semibold text-slate-600">Area</p>
              </div>
            </div>
          </div>
        </section>

        <GigForm
          submitLabel="Post gig"
          onSubmit={async (values) => {
            if (!user) return;
            const gig = await createGig({ client_id: user.id, ...values });
            router.push(`/client/gigs/${gig.id}/applications`);
          }}
        />
      </div>
    </AuthGate>
  );
}
