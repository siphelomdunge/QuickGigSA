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
import { ProfileCompleteness } from '@/components/profile-completeness';
import { ReviewsSection } from '@/components/reviews-section';
import type { WorkerProfile } from '@/lib/mock-data';
import { usePlatformStore } from '@/lib/platform-store';

function splitList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function WorkerProfilePage() {
  const { user } = useAuth();
  const { workerProfiles, updateWorkerProfile } = usePlatformStore();
  const profile = user ? workerProfiles.find((item) => item.user_id === user.id) : undefined;

  return (
    <AuthGate allowedRoles={['worker']}>
      <div className="space-y-8">
        <section className="page-hero p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow">Worker profile</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">{profile?.full_name ?? 'Your worker profile'}</h1>
              <p className="mt-3 max-w-2xl text-slate-600">Keep your skills, experience, and preferred gig categories current.</p>
            </div>
            {profile ? <StatusBadge status={profile.verification_status} /> : null}
          </div>
        </section>

        {profile ? (
          // Keyed by profile id so the form state is initialised once per profile and is not
          // reset by background refetches while the user is typing.
          <WorkerProfileForm key={profile.id} profile={profile} onSave={(data) => updateWorkerProfile(profile.user_id, data)} />
        ) : (
          <EmptyState title="Profile not ready yet" description="Sign up as a worker to create a worker profile." />
        )}

        {profile ? <ProfileCompleteness profile={profile} /> : null}
        {user ? <ReviewsSection userId={user.id} /> : null}
        <EmailPreference />
      </div>
    </AuthGate>
  );
}

type WorkerProfileInput = Pick<WorkerProfile, 'bio' | 'skills' | 'experience' | 'transport_available' | 'preferred_categories'>;

function WorkerProfileForm({ profile, onSave }: { profile: WorkerProfile; onSave: (data: WorkerProfileInput) => Promise<void> }) {
  const [bio, setBio] = useState(profile.bio);
  const [skills, setSkills] = useState(profile.skills.join(', '));
  const [experience, setExperience] = useState(profile.experience);
  const [preferredCategories, setPreferredCategories] = useState(profile.preferred_categories.join(', '));
  const [transportAvailable, setTransportAvailable] = useState(profile.transport_available);
  const [notice, setNotice] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await onSave({
        bio,
        skills: splitList(skills),
        experience,
        preferred_categories: splitList(preferredCategories),
        transport_available: transportAvailable,
      });
      setNotice('Profile updated.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not update your profile.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="panel p-6 sm:p-8">
      <div className="grid gap-5">
        <Textarea label="Bio" rows={4} value={bio} onChange={(event) => setBio(event.target.value)} />
        <Input label="Skills" value={skills} onChange={(event) => setSkills(event.target.value)} placeholder="Delivery, Events, Customer support" />
        <Textarea label="Experience" rows={4} value={experience} onChange={(event) => setExperience(event.target.value)} />
        <Input label="Preferred categories" value={preferredCategories} onChange={(event) => setPreferredCategories(event.target.value)} placeholder="Delivery, Events, Home" />
        <label className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={transportAvailable}
            onChange={(event) => setTransportAvailable(event.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-primary"
          />
          Transport available
        </label>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {notice ? <p className="text-sm font-medium text-secondary">{notice}</p> : <span />}
        <Button type="submit">Save profile</Button>
      </div>
    </form>
  );
}
