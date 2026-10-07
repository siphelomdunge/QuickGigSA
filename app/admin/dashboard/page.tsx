'use client';

import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, FileWarning, ShieldCheck, Users } from 'lucide-react';
import { AuthGate } from '@/components/auth-gate';
import { StatCard } from '@/components/ui/stat-card';
import { usePlatformStore } from '@/lib/platform-store';

export default function AdminDashboardPage() {
  const { users, workerProfiles, clientProfiles, gigs, applications, reports } = usePlatformStore();
  const pendingVerification = [...workerProfiles, ...clientProfiles].filter((profile) => profile.verification_status === 'pending').length;

  return (
    <AuthGate allowedRoles={['admin']}>
      <div className="space-y-8">
        <section className="page-hero p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Admin overview</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Platform operations</h1>
            </div>
            <Link href="/admin/users" className="rounded-full bg-gradient-to-b from-primary-500 to-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-glow-blue ring-1 ring-inset ring-white/20 transition hover:shadow-lift">
              Manage users
            </Link>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Users" value={users.length} icon={Users} tone="blue" />
            <StatCard label="Gigs" value={gigs.length} icon={ShieldCheck} tone="green" />
            <StatCard label="Applications" value={applications.length} icon={FileWarning} tone="slate" />
            <StatCard label="Verification" value={pendingVerification} icon={BriefcaseBusiness} tone="orange" hint="pending review" />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-3">
          {[
            { href: '/admin/gigs', eyebrow: 'Gigs', title: 'Review every posted job', meta: `${gigs.filter((gig) => gig.status === 'open').length} open` },
            { href: '/admin/applications', eyebrow: 'Applications', title: 'Monitor worker requests', meta: `${applications.filter((app) => app.status === 'pending').length} pending` },
            { href: '/admin/verification', eyebrow: 'Verification', title: 'Approve profile reviews', meta: `${pendingVerification} waiting` },
            { href: '/admin/reports', eyebrow: 'Reports', title: 'Track safety reports', meta: `${reports.filter((report) => report.status !== 'resolved').length} active` },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group panel-sm p-6">
              <p className="eyebrow">{item.eyebrow}</p>
              <p className="mt-4 font-display text-2xl font-semibold text-slate-900 transition group-hover:text-primary-700">{item.title}</p>
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700">{item.meta}</span>
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </p>
            </Link>
          ))}
        </div>
      </div>
    </AuthGate>
  );
}
