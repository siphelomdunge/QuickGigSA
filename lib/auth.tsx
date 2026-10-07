'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import { getAuthRedirectUrl } from './auth-redirect';
import { mockUsers, type UserRole } from './mock-data';

type AuthUser = User | {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
    phone?: string;
    location?: string;
    role?: UserRole;
  };
};

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  error: string | null;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (data: { email: string; password: string; full_name: string; phone: string; location: string; role: string; consent?: { terms_version: string } }) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const DEMO_AUTH_KEY = 'quickgig-sa-demo-auth';

/** localStorage can throw (Safari private mode, storage full, disabled). Never let that block auth. */
function safeStorageSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    console.warn('[auth] Could not persist session to localStorage:', error);
  }
}
function safeStorageGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeStorageRemove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function getUserRole(user: AuthUser | null): UserRole | null {
  if (!user) return null;
  const metadata = user.user_metadata as { role?: UserRole } | undefined;
  return metadata?.role ?? null;
}

function createDemoUser(data: { id?: string; email: string; full_name: string; phone?: string; location?: string; role: string }): AuthUser {
  return {
    id: data.id ?? `demo_${Date.now()}`,
    email: data.email,
    user_metadata: {
      full_name: data.full_name,
      phone: data.phone ?? '',
      location: data.location ?? '',
      role: data.role as UserRole,
    },
  };
}

function getMetadataValue(user: AuthUser, key: string) {
  return (user.user_metadata as Record<string, string | undefined>)?.[key];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const ensurePublicProfile = useCallback(async (authUser: AuthUser) => {
    if (!supabase) return null;

    const metadataRole = getUserRole(authUser);
    const resolvedRole = metadataRole === 'client' ? 'client' : 'worker';
    const { data: existingUser } = await supabase.from('users').select('role').eq('id', authUser.id).maybeSingle();

    if (existingUser?.role) {
      return existingUser.role;
    }

    const { error: userError } = await supabase.from('users').insert([
      {
        id: authUser.id,
        email: authUser.email ?? '',
        full_name: getMetadataValue(authUser, 'full_name') ?? authUser.email?.split('@')[0] ?? 'QuickGig user',
        phone: getMetadataValue(authUser, 'phone') ?? '',
        location: getMetadataValue(authUser, 'location') ?? '',
        role: resolvedRole,
        profile_photo_url: getMetadataValue(authUser, 'profile_photo_url') ?? '',
      },
    ]);

    if (userError) {
      return null;
    }

    if (resolvedRole === 'worker') {
      await supabase.from('worker_profiles').insert([{ user_id: authUser.id, verification_status: 'pending' }]);
    }

    if (resolvedRole === 'client') {
      await supabase.from('client_profiles').insert([
        {
          user_id: authUser.id,
          business_name: getMetadataValue(authUser, 'business_name') ?? getMetadataValue(authUser, 'full_name') ?? 'QuickGig client',
          verification_status: 'pending',
        },
      ]);
    }

    return resolvedRole;
  }, []);

  const resolveRole = useCallback(async (authUser: AuthUser | null) => {
    if (!authUser) {
      setRole(null);
      return;
    }

    if (!supabase) {
      setRole(getUserRole(authUser));
      return;
    }

    const publicRole = await ensurePublicProfile(authUser);
    setRole(publicRole);
  }, [ensurePublicProfile]);

  useEffect(() => {
    if (!supabase || !user) return;

    const refreshRole = () => {
      resolveRole(user);
    };

    window.addEventListener('focus', refreshRole);
    document.addEventListener('visibilitychange', refreshRole);

    return () => {
      window.removeEventListener('focus', refreshRole);
      document.removeEventListener('visibilitychange', refreshRole);
    };
  }, [resolveRole, user]);

  useEffect(() => {
    if (!supabase) {
      // Demo mode: hydrate the session from localStorage (an external store) once on mount.
      const storedUser = safeStorageGet(DEMO_AUTH_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(parsedUser);
        setRole(getUserRole(parsedUser));
      }
      setLoading(false);
      return;
    }

    let isActive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isActive) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      resolveRole(data.session?.user ?? null);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) return;
      setSession(session);
      setUser(session?.user ?? null);
      resolveRole(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      isActive = false;
      data.subscription?.unsubscribe();
    };
  }, [resolveRole]);

  const signIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    if (!supabase) {
      setLoading(true);
      setError(null);
      const seededUser = mockUsers.find((item) => item.email.toLowerCase() === email.toLowerCase());
      const fallbackRole = email.toLowerCase().includes('admin') ? 'admin' : email.toLowerCase().includes('client') ? 'client' : 'worker';
      const demoUser = createDemoUser({
        id: seededUser?.id,
        email,
        full_name: seededUser?.full_name ?? email.split('@')[0] ?? 'QuickGig user',
        phone: seededUser?.phone,
        location: seededUser?.location,
        role: seededUser?.role ?? fallbackRole,
      });
      safeStorageSet(DEMO_AUTH_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      setSession(null);
      setRole(getUserRole(demoUser));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
    setSession(data.session);
    setUser(data.user);
    try {
      await resolveRole(data.user);
    } catch (roleError) {
      console.warn('[auth] Could not resolve role after sign-in:', roleError);
    } finally {
      setLoading(false);
    }
  }, [resolveRole]);

  const signUp = useCallback(async ({ email, password, full_name, phone, location, role, consent }: { email: string; password: string; full_name: string; phone: string; location: string; role: string; consent?: { terms_version: string } }) => {
    if (!supabase) {
      setLoading(true);
      setError(null);
      const demoUser = createDemoUser({ email, full_name, phone, location, role });
      safeStorageSet(DEMO_AUTH_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      setSession(null);
      setRole(getUserRole(demoUser));
      setLoading(false);
      return { needsEmailConfirmation: false };
    }

    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          phone,
          location,
          role,
          // The database records the time itself (see the consent_record migration).
          ...(consent ? { accepted_terms: true, terms_version: consent.terms_version } : {}),
        },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      throw error;
    }

    setSession(data.session);
    setUser(data.user ?? null);
    try {
      await resolveRole(data.user ?? null);
    } catch (roleError) {
      // The account exists; a failed profile lookup must not leave the UI stuck. The role is
      // re-resolved on focus / auth state change.
      console.warn('[auth] Could not resolve role after sign-up:', roleError);
      setRole(role === 'client' ? 'client' : 'worker');
    } finally {
      setLoading(false);
    }
    return { needsEmailConfirmation: !data.session };
  }, [resolveRole]);

  const signOut = useCallback(async () => {
    if (!supabase) {
      safeStorageRemove(DEMO_AUTH_KEY);
      setUser(null);
      setSession(null);
      setRole(null);
      setLoading(false);
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
    }
    setUser(null);
    setSession(null);
    setRole(null);
    setLoading(false);
    router.push('/login');
  }, [router]);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!supabase) {
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthRedirectUrl('/reset-password'),
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
    setLoading(false);
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) {
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
      throw error;
    }

    setUser(data.user);
    await resolveRole(data.user);
    setLoading(false);
  }, [resolveRole]);

  const value = useMemo(
    () => ({
      user,
      session,
      role,
      loading,
      error,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
    }),
    [user, session, role, loading, error, signIn, signOut, signUp, sendPasswordReset, updatePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
