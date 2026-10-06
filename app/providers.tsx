'use client';

import { AuthProvider } from '@/lib/auth';
import { PlatformStoreProvider } from '@/lib/platform-store';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PlatformStoreProvider>{children}</PlatformStoreProvider>
    </AuthProvider>
  );
}
