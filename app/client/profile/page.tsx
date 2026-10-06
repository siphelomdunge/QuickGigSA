'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AuthGate } from '@/components/auth-gate';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/status-badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { usePlatformStore } from '@/lib/platform-store';

export default function ClientProfilePage() {
  const { user } = useAuth();
  const { clientProfiles, updateClientProfile } = usePlatformStore();
  const profile = user ? clientProfiles.find((item) => item.user_id === user.id) : undefined;
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!profile) return;
    setBusinessName(profile.business_name);
    setBusinessType(profile.business_type);
    setDescription(profile.description);
  }, [profile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    try {
      await updateClientProfile(user.id, {
        business_name: businessName,
        business_type: businessType,
        description,
      });
      setNotice('Business profile updated.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not update your business profile.');
    }
  };

  return (
    <AuthGate allowedRoles={['client']}>
      <div className="space-y-8">
        <section className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">Client profile</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{profile?.business_name ?? 'Your business profile'}</h1>
              <p className="mt-3 max-w-2xl text-slate-600">Keep your business details clear so workers understand who is posting gigs.</p>
            </div>
            {profile ? <StatusBadge status={profile.verification_status} /> : null}
          </div>
        </section>

        {profile ? (
          <form onSubmit={handleSubmit} className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
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
        ) : (
          <EmptyState title="Profile not ready yet" description="Sign up as a client to create a business profile." />
        )}
      </div>
    </AuthGate>
  );
}
