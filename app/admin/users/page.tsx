'use client';

import { Mail, MapPin, Phone } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { usePlatformStore } from '@/lib/platform-store';

export default function AdminUsersPage() {
  const { users, workerProfiles, clientProfiles } = usePlatformStore();

  return (
    <AuthGate allowedRoles={['admin']}>
      <div className="space-y-8">
        <section className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Users</h1>
          <p className="mt-3 max-w-2xl text-slate-600">Browse registered users, roles, locations, and verification status.</p>
        </section>

        <div className="grid gap-5">
          {users.length ? (
            users.map((user) => {
              const workerProfile = workerProfiles.find((profile) => profile.user_id === user.id);
              const clientProfile = clientProfiles.find((profile) => profile.user_id === user.id);
              const verification = workerProfile?.verification_status ?? clientProfile?.verification_status;

              return (
                <article key={user.id} className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-soft">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-slate-900">{user.full_name}</p>
                        <StatusBadge status={user.role} />
                        {verification ? <StatusBadge status={verification} /> : null}
                      </div>
                      <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                        <span className="inline-flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" />
                          {user.email}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          {user.phone || 'No phone'}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          {user.location || 'No location'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">Joined {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState title="No users yet" description="Registered users will appear here once Supabase auth creates their profile rows." />
          )}
        </div>
      </div>
    </AuthGate>
  );
}
