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
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [preferredCategories, setPreferredCategories] = useState('');
  const [transportAvailable, setTransportAvailable] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!profile) return;
    setBio(profile.bio);
    setSkills(profile.skills.join(', '));
    setExperience(profile.experience);
    setPreferredCategories(profile.preferred_categories.join(', '));
    setTransportAvailable(profile.transport_available);
  }, [profile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;

    try {
      await updateWorkerProfile(user.id, {
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
    <AuthGate allowedRoles={['worker']}>
      <div className="space-y-8">
        <section className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">Worker profile</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{profile?.full_name ?? 'Your worker profile'}</h1>
              <p className="mt-3 max-w-2xl text-slate-600">Keep your skills, experience, and preferred gig categories current.</p>
            </div>
            {profile ? <StatusBadge status={profile.verification_status} /> : null}
          </div>
        </section>

        {profile ? (
          <form onSubmit={handleSubmit} className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
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
                  className="h-4 w-4 rounded border-slate-300 text-primary"
                />
                Transport available
              </label>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {notice ? <p className="text-sm font-medium text-secondary">{notice}</p> : <span />}
              <Button type="submit">Save profile</Button>
            </div>
          </form>
        ) : (
          <EmptyState title="Profile not ready yet" description="Sign up as a worker to create a worker profile." />
        )}
      </div>
    </AuthGate>
  );
}
