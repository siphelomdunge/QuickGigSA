'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface AuthGateProps {
  allowedRoles: string[];
  children: React.ReactNode;
  redirect?: string;
}

export function AuthGate({ allowedRoles, children, redirect = '/login' }: AuthGateProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace(redirect);
      } else if (!allowedRoles.includes(role ?? '')) {
        router.replace('/');
      }
    }
  }, [user, role, loading, router, redirect, allowedRoles]);

  if (loading || !user || !allowedRoles.includes(role ?? '')) {
    return (
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-10 text-center shadow-soft">
        <p className="text-lg font-semibold text-slate-900">Checking your account…</p>
        <p className="mt-3 text-slate-600">Please wait while we confirm your role and access.</p>
      </div>
    );
  }

  return <>{children}</>;
}
