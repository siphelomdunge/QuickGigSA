'use client';

import { usePlatformStore } from '@/lib/platform-store';

export function DemoModeBanner() {
  const { isSupabaseConnected } = usePlatformStore();

  if (isSupabaseConnected) return null;

  return (
    <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <span className="font-semibold">Demo mode:</span> Supabase isn&apos;t configured, so sign-in and data are
      local-only and reset on refresh. Sign-in accepts any password for a seeded demo email — do not deploy this
      build to the public without setting <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>{' '}
      and <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
    </div>
  );
}
