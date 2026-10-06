'use client';

import Link from 'next/link';
import { BriefcaseBusiness, FileWarning, ShieldCheck, Users } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { StatCard } from '@/components/ui/stat-card';
import { usePlatformStore } from '@/lib/platform-store';

export default function AdminDashboardPage() {
  const { users, workerProfiles, clientProfiles, gigs, applications, reports } = usePlatformStore();
  const pendingVerification = [...workerProfiles, ...clientProfiles].filter((profile) => profile.verification_status === 'pending').length;

  return (
    <AuthGate allowedRoles={['admin']}>
      <div className="space-y-8">
        <section className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">Admin overview</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Platform operations</h1>
            </div>
            <Link href="/admin/users" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-600">
              Manage users
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Users" value={users.length} icon={Users} />
            <StatCard label="Gigs" value={gigs.length} icon={ShieldCheck} />
            <StatCard label="Applications" value={applications.length} icon={FileWarning} />
            <StatCard label="Verification" value={pendingVerification} icon={BriefcaseBusiness} />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-3">
          {[
            { href: '/admin/gigs', eyebrow: 'Gigs', title: 'Review every posted job', meta: `${gigs.filter((gig) => gig.status === 'open').length} open` },
            { href: '/admin/applications', eyebrow: 'Applications', title: 'Monitor worker requests', meta: `${applications.filter((app) => app.status === 'pending').length} pending` },
            { href: '/admin/verification', eyebrow: 'Verification', title: 'Approve profile reviews', meta: `${pendingVerification} waiting` },
            { href: '/admin/reports', eyebrow: 'Reports', title: 'Track safety reports', meta: `${reports.filter((report) => report.status !== 'resolved').length} active` },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="rounded-[1.25rem] border border-slate-200 bg-white p-6 shadow-soft transition hover:border-primary">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">{item.eyebrow}</p>
              <p className="mt-4 text-2xl font-semibold text-slate-900">{item.title}</p>
              <p className="mt-3 text-sm text-slate-500">{item.meta}</p>
            </Link>
          ))}
        </div>
      </div>
    </AuthGate>
  );
}
