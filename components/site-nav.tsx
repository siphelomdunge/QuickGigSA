'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export function SiteNav() {
  const { user, role, signOut, loading } = useAuth();

  return (
    <nav className="flex flex-wrap items-center justify-end gap-2 text-sm text-slate-600">
      <Link href="/browse" className="rounded-full px-3 py-2 font-medium transition hover:bg-slate-100 sm:px-4">
        Browse gigs
      </Link>
      {user ? (
        <>
          {role === 'worker' && (
            <>
              <Link href="/worker/dashboard" className="rounded-full px-3 py-2 font-medium transition hover:bg-slate-100 sm:px-4">
                Worker dashboard
              </Link>
              <Link href="/worker/profile" className="rounded-full px-3 py-2 font-medium transition hover:bg-slate-100 sm:px-4">
                Profile
              </Link>
            </>
          )}
          {role === 'client' && (
            <>
              <Link href="/client/dashboard" className="rounded-full px-3 py-2 font-medium transition hover:bg-slate-100 sm:px-4">
                Client dashboard
              </Link>
              <Link href="/client/post-gig" className="rounded-full px-3 py-2 font-medium transition hover:bg-slate-100 sm:px-4">
                Post gig
              </Link>
              <Link href="/client/profile" className="rounded-full px-3 py-2 font-medium transition hover:bg-slate-100 sm:px-4">
                Business profile
              </Link>
            </>
          )}
          {role === 'admin' && (
            <>
              <Link href="/admin/dashboard" className="rounded-full px-3 py-2 font-medium transition hover:bg-slate-100 sm:px-4">
                Admin
              </Link>
            </>
          )}
          <button
            disabled={loading}
            onClick={signOut}
            className="rounded-full border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:px-4"
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <Link href="/register" className="rounded-full bg-primary px-4 py-2 font-semibold text-white shadow-glow-blue transition hover:bg-blue-600">
            Register
          </Link>
          <Link href="/login" className="rounded-full border border-slate-300 bg-white px-4 py-2 font-semibold transition hover:border-slate-400 hover:bg-slate-50">
            Login
          </Link>
        </>
      )}
    </nav>
  );
}
