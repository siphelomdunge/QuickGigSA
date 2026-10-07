'use client';

import { FlaskConical } from 'lucide-react';
import { usePlatformStore } from '@/lib/platform-store';

export function DemoModeBanner() {
  const { isSupabaseConnected } = usePlatformStore();

  if (isSupabaseConnected) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/60 px-4 py-3 text-sm text-amber-900 shadow-soft">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <FlaskConical className="h-4 w-4" />
      </span>
      <p className="leading-6">
        <span className="font-semibold">Demo mode.</span> Supabase isn&apos;t configured, so sign-in and data are local-only. Any password works for a seeded
        email such as <code className="rounded-md bg-white/70 px-1.5 py-0.5 font-mono text-xs">anele@example.com</code> (worker),{' '}
        <code className="rounded-md bg-white/70 px-1.5 py-0.5 font-mono text-xs">nandi@example.com</code> (client) or{' '}
        <code className="rounded-md bg-white/70 px-1.5 py-0.5 font-mono text-xs">sipho@example.com</code> (admin). Set{' '}
        <code className="rounded-md bg-white/70 px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
        <code className="rounded-md bg-white/70 px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> before deploying.
      </p>
    </div>
  );
}
