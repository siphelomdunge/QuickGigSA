'use client';

import { useState, type FormEvent } from 'react';
import { AuthGate } from '@/components/auth-gate';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { EmailPreference } from '@/components/email-preference';
import { ReviewsSection } from '@/components/reviews-section';
import type { ClientProfile } from '@/lib/mock-data';
import { usePlatformStore } from '@/lib/platform-store';

export default function ClientProfilePage() {
  const { user } = useAuth();
  const { clientProfiles, updateClientProfile } = usePlatformStore();
  const profile = user ? clientProfiles.find((item) => item.user_id === user.id) : undefined;

  return (
    <AuthGate allowedRoles={['client']}>
      <div className="space-y-8">
        <section className="page-hero p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow">Client profile</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">{profile?.business_name ?? 'Your business profile'}</h1>
              <p className="mt-3 max-w-2xl text-slate-600">Keep your business details clear so workers understand who is posting gigs.</p>
            </div>
            {profile ? <StatusBadge status={profile.verification_status} /> : null}
          </div>
        </section>

        {profile ? (
          // Keyed by profile id so the form state is initialised once per profile and is not
          // reset by background refetches while the user is typing.
          <ClientProfileForm key={profile.id} profile={profile} onSave={(data) => updateClientProfile(profile.user_id, data)} />
        ) : (
          <EmptyState title="Profile not ready yet" description="Sign up as a client to create a business profile." />
        )}

        {user ? <ReviewsSection userId={user.id} title="Reviews from workers" /> : null}
        <EmailPreference />
      </div>
    </AuthGate>
  );
}

function ClientProfileForm({
  profile,
  onSave,
}: {
  profile: ClientProfile;
  onSave: (data: Pick<ClientProfile, 'business_name' | 'business_type' | 'description'>) => Promise<void>;
}) {
  const [businessName, setBusinessName] = useState(profile.business_name);
  const [businessType, setBusinessType] = useState(profile.business_type);
  const [description, setDescription] = useState(profile.description);
  const [notice, setNotice] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await onSave({ business_name: businessName, business_type: businessType, description });
      setNotice('Business profile updated.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not update your business profile.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="panel p-6 sm:p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <Input label="Business name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} />
        <Input label="Business type" value={businessType} onChange={(event) => setBusinessType(event.target.value)} placeholder="Food, events, retail, agency" />
        <div className="md:col-span-2">
          <Textarea label="Description" rows={5} value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {notice ? <p className="text-sm font-medium text-secondary">{notice}</p> : <span />}
        <Button type="submit">Save business profile</Button>
      </div>
    </form>
  );
}
