'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/auth';
import { PlatformStoreProvider } from '@/lib/platform-store';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <PlatformStoreProvider>{children}</PlatformStoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
